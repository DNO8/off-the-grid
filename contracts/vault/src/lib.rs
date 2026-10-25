#![no_std]

use p256::ecdsa::{signature::hazmat::PrehashVerifier, Signature, VerifyingKey};
use soroban_sdk::{
    address_payload::AddressPayload, contract, contracterror, contractimpl, contracttype,
    token, symbol_short, Address, Bytes, BytesN, Env, String,
};

const CHEQUE_BODY_BYTES: u32 = 179;
const CHEQUE_WIRE_BYTES: u32 = 243;
const MAX_FEE: u64 = 0xffff_ffff;

#[contract]
pub struct Vault;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum VaultError {
    Frame = 1,
    BadSignature = 2,
    Amount = 3,
    Fee = 4,
    Cap = 5,
    Network = 6,
    Vault = 7,
    Expired = 8,
    Owner = 9,
    Lock = 10,
    DeviceKey = 11,
    NoteUsed = 12,
    Collateral = 13,
    Caller = 14,
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Config,
    Account(BytesN<32>),
    Spent(BytesN<16>),
}

#[contracttype]
#[derive(Clone)]
struct Config {
    vault_id: BytesN<32>,
    token: Address,
}

#[contracttype]
#[derive(Clone)]
struct Account {
    device_key: BytesN<33>,
    remaining: i128,
    locked_until: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SettleResult {
    pub fee: i128,
    pub remaining: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SettleOutcome {
    pub ok: bool,
    pub fee: i128,
    pub remaining: i128,
    pub note_id: Option<BytesN<16>>,
    pub reason: Option<String>,
}

#[contractimpl]
impl Vault {
    pub fn __constructor(env: Env, vault_id: BytesN<32>, token: Address, admin: Address) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Config, &Config { vault_id, token });
    }

    pub fn deposit(
        env: Env,
        owner: BytesN<32>,
        device_key: BytesN<33>,
        collateral: i128,
        locked_until: u64,
    ) -> Result<(), VaultError> {
        let owner_address = AddressPayload::AccountIdPublicKeyEd25519(owner.clone()).to_address(&env);
        owner_address.require_auth();
        if env.storage().persistent().has(&DataKey::Account(owner.clone())) {
            return Err(VaultError::Owner);
        }
        if collateral <= 0 || locked_until < env.ledger().timestamp() {
            return Err(VaultError::Amount);
        }
        let config: Config = env.storage().instance().get(&DataKey::Config).unwrap();
        token::Client::new(&env, &config.token).transfer(
            &owner_address,
            &env.current_contract_address(),
            &collateral,
        );
        env.storage().persistent().set(&DataKey::Account(owner), &Account {
            device_key,
            remaining: collateral,
            locked_until,
        });
        Ok(())
    }

    pub fn settle(env: Env, wire: Bytes, settler: Address) -> SettleOutcome {
        let note_id = if wire.len() == CHEQUE_WIRE_BYTES {
            Some(wire.slice(34..50).try_into().unwrap())
        } else {
            None
        };
        match Self::settle_inner(env.clone(), wire, settler) {
            Ok(result) => {
                env.events().publish((symbol_short!("settled"),), (note_id.clone(), result.fee));
                SettleOutcome { ok: true, fee: result.fee, remaining: result.remaining, note_id, reason: None }
            }
            Err(error) => {
                let reason = String::from_str(&env, error.reason());
                env.events().publish((symbol_short!("rejected"),), (note_id.clone(), reason.clone()));
                SettleOutcome { ok: false, fee: 0, remaining: 0, note_id, reason: Some(reason) }
            }
        }
    }

    fn settle_inner(env: Env, wire: Bytes, settler: Address) -> Result<SettleResult, VaultError> {
        settler.require_auth();
        if wire.len() != CHEQUE_WIRE_BYTES || wire.get(0) != Some(1) {
            return Err(VaultError::Frame);
        }
        let body = wire.slice(0..CHEQUE_BODY_BYTES);
        let signature_bytes = wire.slice(CHEQUE_BODY_BYTES..CHEQUE_WIRE_BYTES);
        let device_key_bytes = body.slice(146..179);
        let mut signature_array = [0u8; 64];
        signature_bytes.copy_into_slice(&mut signature_array);
        let mut device_key_array = [0u8; 33];
        device_key_bytes.copy_into_slice(&mut device_key_array);
        let signature = Signature::from_slice(&signature_array).map_err(|_| VaultError::BadSignature)?;
        if signature.normalize_s().is_some() {
            return Err(VaultError::BadSignature);
        }
        let verifying_key = VerifyingKey::from_sec1_bytes(&device_key_array)
            .map_err(|_| VaultError::BadSignature)?;
        let digest = env.crypto().sha256(&body);
        verifying_key.verify_prehash(&digest.to_array(), &signature)
            .map_err(|_| VaultError::BadSignature)?;
        let uncompressed = verifying_key.to_encoded_point(false);
        let public_key = BytesN::<65>::from_array(&env, uncompressed.as_bytes().try_into().unwrap());
        env.crypto().secp256r1_verify(&public_key, &digest, &BytesN::from_array(&env, &signature_array));

        let amount = read_u64(&body, 50);
        let fee = read_u64(&body, 58);
        let cap = read_u64(&body, 66);
        if amount == 0 { return Err(VaultError::Amount); }
        if fee > MAX_FEE { return Err(VaultError::Fee); }
        let total = amount.checked_add(fee).ok_or(VaultError::Cap)?;
        if total > cap { return Err(VaultError::Cap); }

        let config: Config = env.storage().instance().get(&DataKey::Config).unwrap();
        if body.get(1) != Some(1) { return Err(VaultError::Network); }
        let vault_id: BytesN<32> = body.slice(2..34).try_into().unwrap();
        if vault_id != config.vault_id { return Err(VaultError::Vault); }
        if env.ledger().timestamp() > read_u64(&body, 74) { return Err(VaultError::Expired); }
        let owner_id: BytesN<32> = body.slice(114..146).try_into().unwrap();
        let account_key = DataKey::Account(owner_id);
        let mut account: Account = env.storage().persistent().get(&account_key).ok_or(VaultError::Owner)?;
        if read_u64(&body, 74) > account.locked_until { return Err(VaultError::Lock); }
        let device_key: BytesN<33> = device_key_bytes.try_into().unwrap();
        if device_key != account.device_key { return Err(VaultError::DeviceKey); }
        let note_id: BytesN<16> = body.slice(34..50).try_into().unwrap();
        let spent_key = DataKey::Spent(note_id);
        if env.storage().persistent().has(&spent_key) { return Err(VaultError::NoteUsed); }
        if i128::from(total) > account.remaining { return Err(VaultError::Collateral); }

        account.remaining -= i128::from(total);
        env.storage().persistent().set(&account_key, &account);
        env.storage().persistent().set(&spent_key, &true);
        let payee_id: BytesN<32> = body.slice(82..114).try_into().unwrap();
        let payee = AddressPayload::AccountIdPublicKeyEd25519(payee_id).to_address(&env);
        let token = token::Client::new(&env, &config.token);
        token.transfer(&env.current_contract_address(), &payee, &i128::from(amount));
        token.transfer(&env.current_contract_address(), &settler, &i128::from(fee));
        Ok(SettleResult { fee: i128::from(fee), remaining: account.remaining })
    }
}

impl VaultError {
    fn reason(&self) -> &'static str {
        match self {
            Self::Frame => "frame",
            Self::BadSignature => "bad-signature",
            Self::Amount => "amount",
            Self::Fee => "fee",
            Self::Cap => "cap",
            Self::Network => "network",
            Self::Vault => "vault",
            Self::Expired => "expired",
            Self::Owner => "owner",
            Self::Lock => "lock",
            Self::DeviceKey => "device-key",
            Self::NoteUsed => "note-used",
            Self::Collateral => "collateral",
            Self::Caller => "caller",
        }
    }
}

fn read_u64(bytes: &Bytes, offset: u32) -> u64 {
    let mut result = 0u64;
    for index in 0..8 {
        result |= u64::from(bytes.get(offset + index).unwrap()) << (index * 8);
    }
    result
}

#[cfg(test)]
mod test;
