import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { NETWORK_TESTNET } from "../protocol/cheque.mjs";
import { createWitness, inspectWitnessCheque } from "../protocol/mesh.mjs";
import { uploadWitnessCheque } from "../scripts/witness-upload.mjs";

const chequeVector = JSON.parse(readFileSync(new URL("../protocol/cheque-vector.json", import.meta.url)));
const vault = Buffer.alloc(32, 1);

test("Wi-Fi witness submits one wire and persists its hash only after chain success", async () => {
  const witness = createWitness({ network: NETWORK_TESTNET, vault });
  let calls = 0;
  const submit = async (wire) => {
    calls++;
    assert.equal(wire.toString("hex"), chequeVector.bodyHex + chequeVector.signatureHex);
    return { ok: true, fee: 100_000n, txHash: "a".repeat(64) };
  };
  assert.deepEqual(inspectWitnessCheque(witness, chequeVector.frame), { ok: true, status: "pending" });
  const first = await uploadWitnessCheque({ witness, chequeFrame: chequeVector.frame, submit });
  assert.equal(first.ok, true);
  assert.equal(witness.noteHashes.size, 1);
  assert.deepEqual(inspectWitnessCheque(witness, chequeVector.frame), { ok: false, reason: "note-used" });
  const second = await uploadWitnessCheque({ witness, chequeFrame: chequeVector.frame, submit });
  assert.deepEqual(second, { ok: false, reason: "note-used", local: true });
  assert.equal(calls, 1);
});

test("a chain note-used result flags the hash, but unrelated rejection does not", async () => {
  const witness = createWitness({ network: NETWORK_TESTNET, vault });
  const failed = await uploadWitnessCheque({
    witness, chequeFrame: chequeVector.frame, submit: async () => ({ ok: false, reason: "expired" }),
  });
  assert.equal(failed.reason, "expired");
  assert.equal(witness.noteHashes.size, 0);
  const used = await uploadWitnessCheque({
    witness, chequeFrame: chequeVector.frame, submit: async () => ({ ok: false, reason: "note-used" }),
  });
  assert.equal(used.reason, "note-used");
  assert.equal(witness.noteHashes.size, 1);
});
