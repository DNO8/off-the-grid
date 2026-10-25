extern crate std;

use super::*;
use soroban_sdk::{contract, contractimpl, testutils::{Address as _, Ledger as _}, token, Address, Bytes, BytesN, Env};

#[contract]
struct TestToken;

#[contractimpl]
impl TestToken {
    pub fn mint(env: Env, to: Address, amount: i128) {
        let current: i128 = env.storage().persistent().get(&to).unwrap_or(0);
        env.storage().persistent().set(&to, &(current + amount));
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        let current: i128 = env.storage().persistent().get(&from).unwrap_or(0);
        assert!(current >= amount && amount >= 0);
        let received: i128 = env.storage().persistent().get(&to).unwrap_or(0);
        env.storage().persistent().set(&from, &(current - amount));
        env.storage().persistent().set(&to, &(received + amount));
    }

    pub fn balance(env: Env, id: Address) -> i128 {
        env.storage().persistent().get(&id).unwrap_or(0)
    }
}

fn frozen_wire(env: &Env) -> Bytes {
    let fixture: serde_json::Value = serde_json::from_str(include_str!("../../../protocol/cheque-vector.json")).unwrap();
    let mut wire = hex::decode(fixture["bodyHex"].as_str().unwrap()).unwrap();
    wire.extend(hex::decode(fixture["signatureHex"].as_str().unwrap()).unwrap());
    Bytes::from_slice(env, &wire)
}

#[test]
fn first_settle_pays_and_second_note_is_used() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let token_address = env.register(TestToken, ());
    let token_admin = TestTokenClient::new(&env, &token_address);
    let token_client = token::Client::new(&env, &token_address);
    env.ledger().with_mut(|li| li.timestamp = 1_600_000_000);
    let contract_id = env.register(Vault, (BytesN::from_array(&env, &[1; 32]), token_address.clone(), admin.clone()));
    let vault = VaultClient::new(&env, &contract_id);
    let owner = BytesN::from_array(&env, &[4; 32]);
    let owner_address = soroban_sdk::address_payload::AddressPayload::AccountIdPublicKeyEd25519(owner.clone()).to_address(&env);
    let key: [u8; 33] = hex::decode("02de0da91a51db50590ecebe84f7708733152db212a04dae042563a84b9b7d66ce").unwrap().try_into().unwrap();
    let device_key = BytesN::from_array(&env, &key);
    token_admin.mint(&owner_address, &20_000_000);
    vault.deposit(&owner, &device_key, &20_000_000, &2_000_000_000);
    let first = Address::generate(&env);
    let second = Address::generate(&env);
    let wire = frozen_wire(&env);
    let result = vault.settle(&wire, &first);
    assert!(result.ok);
    assert_eq!(result.fee, 100_000);
    assert_eq!(token_client.balance(&first), 100_000);
    let duplicate = vault.settle(&wire, &second);
    assert!(!duplicate.ok);
    assert_eq!(duplicate.reason, Some(soroban_sdk::String::from_str(&env, "note-used")));
    assert_eq!(duplicate.fee, 0);
    assert_eq!(token_client.balance(&second), 0);
}

#[test]
fn collateral_rejection_does_not_erase_an_earlier_spent_note() {
    const SECOND_WIRE_HEX: &str = "01010101010101010101010101010101010101010101010101010101010101010101050505050505050505050505050505058096980000000000a086010000000000201d9a000000000010ff5365000000000303030303030303030303030303030303030303030303030303030303030303040404040404040404040404040404040404040404040404040404040404040402de0da91a51db50590ecebe84f7708733152db212a04dae042563a84b9b7d66ce2efa7d1bd4ece5b1b8ba40ea35398e76e6b1362d785520ac15378991fe8209fc17b19919fa775bbb19a34c5bf8b65440f9fde82da82d1b2bb8274aed872ec31c";
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = 1_600_000_000);
    let admin = Address::generate(&env);
    let token_address = env.register(TestToken, ());
    let token_admin = TestTokenClient::new(&env, &token_address);
    let token_client = token::Client::new(&env, &token_address);
    let contract_id = env.register(Vault, (BytesN::from_array(&env, &[1; 32]), token_address.clone(), admin));
    let vault = VaultClient::new(&env, &contract_id);
    let owner = BytesN::from_array(&env, &[4; 32]);
    let owner_address = soroban_sdk::address_payload::AddressPayload::AccountIdPublicKeyEd25519(owner.clone()).to_address(&env);
    let key: [u8; 33] = hex::decode("02de0da91a51db50590ecebe84f7708733152db212a04dae042563a84b9b7d66ce").unwrap().try_into().unwrap();
    token_admin.mint(&owner_address, &15_000_000);
    vault.deposit(&owner, &BytesN::from_array(&env, &key), &15_000_000, &2_000_000_000);
    let first = Address::generate(&env);
    let second = Address::generate(&env);
    let frozen = frozen_wire(&env);
    vault.settle(&frozen, &first);
    let other = Bytes::from_slice(&env, &hex::decode(SECOND_WIRE_HEX).unwrap());
    assert_eq!(vault.settle(&other, &second).reason, Some(soroban_sdk::String::from_str(&env, "collateral")));
    assert_eq!(vault.settle(&frozen, &second).reason, Some(soroban_sdk::String::from_str(&env, "note-used")));
    assert_eq!(token_client.balance(&first), 100_000);
    assert_eq!(token_client.balance(&second), 0);
}
