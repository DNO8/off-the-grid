import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import {
  DEMO_FEE,
  issueCheque,
  NETWORK_TESTNET,
  USDC,
} from "../protocol/cheque.mjs";
import { issueCheckpoint } from "../protocol/checkpoint.mjs";
import {
  acceptPayment,
  connectPhone,
  createPhone,
  encounter,
  meshLedger,
  partyPayments,
} from "../protocol/mesh.mjs";
import {
  createVault,
  deposit,
  rotateDeviceKey,
  withdrawAfterExpiry,
} from "../protocol/vault.mjs";
import { generateIdentity } from "../protocol/p256.mjs";

function fixture() {
  const vaultId = Buffer.alloc(32, 9);
  const payerKey = generateIdentity();
  const owner = Buffer.alloc(32, 4);
  const now = 1_700_000_000;
  const lockedUntil = now + 3600;
  const vault = createVault({ network: NETWORK_TESTNET, vault: vaultId });
  assert.equal(
    deposit(vault, {
      owner,
      caller: owner,
      deviceKey: payerKey.compressed,
      collateral: 5n * USDC,
      lockedUntil,
    }).ok,
    true,
  );
  return { vault, vaultId, payerKey, owner, now, lockedUntil };
}

function phone(vaultId, id, fill) {
  return createPhone({
    id,
    network: NETWORK_TESTNET,
    vault: vaultId,
    identity: generateIdentity(),
    account: Buffer.alloc(32, fill),
  });
}

function pay(env, fields = {}) {
  return issueCheque(
    {
      network: NETWORK_TESTNET,
      vault: env.vaultId,
      noteId: randomBytes(16),
      amount: USDC,
      fee: DEMO_FEE,
      cap: 2n * USDC,
      expiry: BigInt(env.lockedUntil),
      payee: Buffer.alloc(32, 5),
      owner: env.owner,
      ...fields,
    },
    env.payerKey.privateKey,
    env.payerKey.compressed,
  );
}

test("the owner can withdraw after the lock and the device key cannot", () => {
  const env = fixture();
  const stranger = Buffer.alloc(32, 7);
  assert.deepEqual(
    withdrawAfterExpiry(env.vault, {
      owner: env.owner,
      caller: stranger,
      now: env.lockedUntil + 1,
    }),
    { ok: false, reason: "caller" },
  );
  assert.equal(
    withdrawAfterExpiry(env.vault, {
      owner: env.owner,
      caller: env.owner,
      now: env.lockedUntil,
    }).reason,
    "locked",
  );
  const taken = withdrawAfterExpiry(env.vault, {
    owner: env.owner,
    caller: env.owner,
    now: env.lockedUntil + 1,
  });
  assert.equal(taken.ok, true);
  assert.equal(taken.amount, 5n * USDC);
});

test("rotation lets the new phone sign and keeps an in-flight cheque valid until the lock", () => {
  const env = fixture();
  const merchant = phone(env.vaultId, "merchant", 5);
  const inFlight = pay(env);
  assert.equal(acceptPayment(merchant, inFlight.frame, env.now).ok, true);
  const next = generateIdentity();
  assert.equal(
    rotateDeviceKey(env.vault, {
      owner: env.owner,
      caller: Buffer.alloc(32, 1),
      newDeviceKey: next.compressed,
    }).reason,
    "caller",
  );
  assert.equal(
    rotateDeviceKey(env.vault, {
      owner: env.owner,
      caller: env.owner,
      newDeviceKey: next.compressed,
    }).ok,
    true,
  );
  const uploaded = connectPhone(env.vault, merchant, env.now);
  assert.deepEqual(uploaded.rejected, []);
  assert.equal(uploaded.reward, DEMO_FEE);

  env.payerKey = next;
  const merchantTwo = phone(env.vaultId, "merchant-2", 6);
  const fresh = pay(env);
  acceptPayment(merchantTwo, fresh.frame, env.now);
  const second = connectPhone(env.vault, merchantTwo, env.now);
  assert.equal(second.settled.length, 1);
  assert.equal(second.reward, DEMO_FEE);
});

test("one bad cheque does not roll back a good one", () => {
  const env = fixture();
  const merchant = phone(env.vaultId, "merchant", 5);
  const expired = pay(env, { expiry: BigInt(env.now + 10) });
  const good = pay(env);
  acceptPayment(merchant, expired.frame, env.now);
  acceptPayment(merchant, good.frame, env.now);
  const result = connectPhone(env.vault, merchant, env.now + 11);
  assert.deepEqual(result.settled, [hexNote(good)]);
  assert.equal(result.rejected.length, 1);
  assert.equal(result.rejected[0].reason, "expired");
  assert.equal(result.reward, DEMO_FEE);
});

test("collateral pays the first note and refuses the second without undoing the first", () => {
  const env = fixture();
  const merchant = phone(env.vaultId, "merchant", 5);
  const fields = { amount: 3n * USDC, fee: DEMO_FEE, cap: 4n * USDC };
  const first = pay(env, fields);
  const second = pay(env, fields);
  acceptPayment(merchant, first.frame, env.now);
  acceptPayment(merchant, second.frame, env.now);
  const result = connectPhone(env.vault, merchant, env.now);
  assert.deepEqual(result.settled, [hexNote(first)]);
  assert.equal(result.rejected[0].reason, "collateral");
  assert.equal(result.reward, DEMO_FEE);
  assert.equal(env.vault.spent.size, 1);
});

test("the first phone online earns the fee and the checkpoint hops to a phone that never connects", () => {
  const env = fixture();
  const merchant = phone(env.vaultId, "merchant", 5);
  const relay = phone(env.vaultId, "relay", 6);
  const far = phone(env.vaultId, "far", 8);
  const cheque = pay(env, { payee: merchant.account });
  assert.equal(acceptPayment(merchant, cheque.frame, env.now).status, "pending");
  assert.equal(partyPayments(merchant)[0].amount, USDC);
  assert.equal(meshLedger(merchant).length, 0);

  const uploaded = connectPhone(env.vault, merchant, env.now);
  assert.equal(uploaded.reward, DEMO_FEE);
  assert.equal(env.vault.fees.get(merchant.account.toString("hex")), DEMO_FEE);
  assert.equal(meshLedger(merchant)[0].status, "settled");

  encounter(merchant, relay);
  encounter(relay, far);
  assert.equal(partyPayments(far).length, 0);
  assert.equal(meshLedger(far).length, 1);
  assert.equal(meshLedger(far)[0].status, "heard");
  assert.equal(meshLedger(far)[0].noteId, hexNote(cheque));
  assert.equal(meshLedger(far)[0].reward, DEMO_FEE.toString());
  assert.equal(meshLedger(relay)[0].status, "heard");

  const late = phone(env.vaultId, "late", 11);
  acceptPayment(late, cheque.frame, env.now);
  const race = connectPhone(env.vault, late, env.now);
  assert.equal(race.reward, 0n);
  assert.equal(race.rejected[0].reason, "note-used");
  assert.equal(race.settled.length, 0);
  assert.equal(meshLedger(late)[0].status, "settled");
  assert.equal(env.vault.fees.get(late.account.toString("hex")), undefined);
});

test("a signed lie does not stop the real upload", () => {
  const env = fixture();
  const merchant = phone(env.vaultId, "merchant", 5);
  const liar = phone(env.vaultId, "liar", 12);
  const cheque = pay(env);
  acceptPayment(merchant, cheque.frame, env.now);
  const claim = issueCheckpoint(
    {
      network: NETWORK_TESTNET,
      vault: env.vaultId,
      ledgerSequence: 9,
      reward: 1n,
      noteId: openNote(cheque),
    },
    liar.identity.privateKey,
    liar.identity.compressed,
  );
  liar.carrying.add(claim);
  encounter(liar, merchant);
  assert.equal(meshLedger(merchant)[0].status, "conflict");
  const uploaded = connectPhone(env.vault, merchant, env.now);
  assert.equal(uploaded.reward, DEMO_FEE);
  assert.equal(meshLedger(merchant)[0].status, "settled");
  encounter(merchant, liar);
  assert.equal(merchant.carrying.has(claim), false);
  assert.equal(merchant.carrying.size, 1);
});

test("a stranger device key is pending on the merchant and rejected by the vault", () => {
  const env = fixture();
  const merchant = phone(env.vaultId, "merchant", 5);
  const stranger = generateIdentity();
  const cheque = issueCheque(
    {
      network: NETWORK_TESTNET,
      vault: env.vaultId,
      noteId: randomBytes(16),
      amount: USDC,
      fee: DEMO_FEE,
      cap: 2n * USDC,
      expiry: BigInt(env.lockedUntil),
      payee: merchant.account,
      owner: env.owner,
    },
    stranger.privateKey,
    stranger.compressed,
  );
  assert.equal(acceptPayment(merchant, cheque.frame, env.now).status, "pending");
  const uploaded = connectPhone(env.vault, merchant, env.now);
  assert.equal(uploaded.rejected[0].reason, "device-key");
  assert.equal(env.vault.spent.size, 0);
  assert.equal(partyPayments(merchant)[0].status, "rejected");
});

function hexNote(cheque) {
  return cheque.body.subarray(34, 50).toString("hex");
}

function openNote(cheque) {
  return cheque.body.subarray(34, 50);
}
