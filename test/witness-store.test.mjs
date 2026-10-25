import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { issueCheque, NETWORK_TESTNET, DEMO_FEE, USDC } from "../protocol/cheque.mjs";
import { createWitness, inspectWitnessCheque, recordWitnessCheckpoint, witnessSnapshot } from "../protocol/mesh.mjs";
import { generateIdentity } from "../protocol/p256.mjs";
import { createVault, deposit, settleCheque } from "../protocol/vault.mjs";
import { loadWitnessState, saveWitnessState } from "../scripts/witness-state.mjs";

test("the witness flags a second signed cheque only after settlement and stores a note hash", () => {
  const vaultId = Buffer.alloc(32, 7);
  const owner = Buffer.alloc(32, 4);
  const noteId = Buffer.alloc(16, 9);
  const payer = generateIdentity();
  const settler = generateIdentity();
  const vault = createVault({ network: NETWORK_TESTNET, vault: vaultId });
  const witness = createWitness({ network: NETWORK_TESTNET, vault: vaultId, checkpointKey: settler.compressed });
  assert.equal(deposit(vault, {
    owner, caller: owner, deviceKey: payer.compressed,
    collateral: 5n * USDC, lockedUntil: 2_000_000_000,
  }).ok, true);

  function cheque(payee) {
    return issueCheque({
      network: NETWORK_TESTNET, vault: vaultId, noteId,
      amount: USDC, fee: DEMO_FEE, cap: 2n * USDC,
      expiry: 1_900_000_000n, payee: Buffer.alloc(32, payee), owner,
    }, payer.privateKey, payer.compressed).frame;
  }

  const first = cheque(5);
  const second = cheque(6);
  assert.deepEqual(inspectWitnessCheque(witness, first), { ok: true, status: "pending" });
  const outcome = settleCheque(vault, first, {
    account: Buffer.alloc(32, 3), privateKey: settler.privateKey,
    deviceKey: settler.compressed, now: 1_800_000_000, ledgerSequence: 1234,
  });
  assert.equal(outcome.ok, true);
  const untrusted = createWitness({ network: NETWORK_TESTNET, vault: vaultId });
  assert.deepEqual(recordWitnessCheckpoint(untrusted, outcome.frame), { ok: false, reason: "device-key" });
  assert.equal(untrusted.noteHashes.size, 0);
  assert.deepEqual(recordWitnessCheckpoint(witness, outcome.frame), { ok: true, recorded: true });
  assert.deepEqual(inspectWitnessCheque(witness, second), { ok: false, reason: "note-used" });
  assert.deepEqual(recordWitnessCheckpoint(witness, outcome.frame), { ok: true, recorded: false });
  assert.deepEqual(witnessSnapshot(witness).noteHashes, [createHash("sha256").update(noteId).digest("hex")]);
});

test("the laptop witness persists only hashes and restores its vault scope", () => {
  const folder = mkdtempSync(join(tmpdir(), "sozu-witness-"));
  try {
    const path = join(folder, "state.json");
    const vault = Buffer.alloc(32, 2);
    const witness = loadWitnessState(path, { network: NETWORK_TESTNET, vault });
    witness.noteHashes.add(createHash("sha256").update(Buffer.alloc(16, 3)).digest("hex"));
    saveWitnessState(path, witness);
    const raw = readFileSync(path, "utf8");
    assert.equal(raw.includes("noteId"), false);
    assert.deepEqual(witnessSnapshot(loadWitnessState(path, { network: NETWORK_TESTNET, vault })), witnessSnapshot(witness));
    assert.throws(() => loadWitnessState(path, { network: NETWORK_TESTNET, vault: Buffer.alloc(32, 4) }), /vault/);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});
