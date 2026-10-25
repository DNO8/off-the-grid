import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { issueCheque, openCheque, NETWORK_TESTNET } from "../protocol/cheque.mjs";
import { issueCheckpoint, openCheckpoint } from "../protocol/checkpoint.mjs";
import { FRAGMENT_BUDGET_BYTES } from "../protocol/text-message.mjs";
import { flipS, generateIdentity, identityFromJwk, isLowS, verifyP256 } from "../protocol/p256.mjs";

const vector = JSON.parse(
  readFileSync(new URL("../protocol/cheque-vector.json", import.meta.url)),
);

test("a P-256 signature is low-S and a high-S twin is rejected", () => {
  const identity = generateIdentity();
  const issued = issueCheque(
    {
      network: NETWORK_TESTNET,
      vault: Buffer.alloc(32, 1),
      noteId: Buffer.alloc(16, 2),
      amount: 1n,
      fee: 1n,
      cap: 2n,
      expiry: 10n,
      payee: Buffer.alloc(32, 3),
      owner: Buffer.alloc(32, 4),
    },
    identity.privateKey,
    identity.compressed,
  );
  assert.equal(isLowS(issued.signature), true);
  assert.equal(verifyP256(issued.body, issued.signature, identity.compressed), true);
  const high = flipS(issued.signature);
  assert.equal(isLowS(high), false);
  assert.equal(verifyP256(issued.body, high, identity.compressed), false);
});

test("the frozen cheque vector verifies", () => {
  const identity = identityFromJwk(vector.jwk);
  const opened = openCheque(vector.frame);
  assert.equal(opened.ok, true);
  assert.equal(opened.digest.toString("hex"), vector.digestHex);
  assert.equal(opened.deviceKey.toString("hex"), vector.publicKeyHex);
  assert.equal(opened.signature.toString("hex"), vector.signatureHex);
  assert.equal(isLowS(opened.signature), true);
  assert.equal(identity.compressed.toString("hex"), vector.publicKeyHex);
  const again = issueCheque(
    {
      network: opened.network,
      vault: opened.vault,
      noteId: opened.noteId,
      amount: opened.amount,
      fee: opened.fee,
      cap: opened.cap,
      expiry: opened.expiry,
      payee: opened.payee,
      owner: opened.owner,
    },
    identity.privateKey,
    identity.compressed,
  );
  assert.equal(again.body.toString("hex"), vector.bodyHex);
  assert.equal(again.digest.toString("hex"), vector.digestHex);
  assert.equal(verifyP256(again.body, opened.signature, identity.compressed), true);
});

test("a cheque occupies two fragments and a checkpoint occupies one", () => {
  const identity = generateIdentity();
  const vault = Buffer.alloc(32, 8);
  const cheque = issueCheque(
    {
      network: NETWORK_TESTNET,
      vault,
      noteId: Buffer.alloc(16, 1),
      amount: 5n,
      fee: 1n,
      cap: 6n,
      expiry: 90n,
      payee: Buffer.alloc(32, 2),
      owner: Buffer.alloc(32, 3),
    },
    identity.privateKey,
    identity.compressed,
  );
  assert.ok(cheque.frame.length > FRAGMENT_BUDGET_BYTES);
  assert.ok(cheque.frame.length <= FRAGMENT_BUDGET_BYTES * 2);
  const claim = issueCheckpoint(
    {
      network: NETWORK_TESTNET,
      vault,
      ledgerSequence: 1001,
      reward: 1n,
      noteId: Buffer.alloc(16, 1),
    },
    identity.privateKey,
    identity.compressed,
  );
  assert.ok(claim.length <= FRAGMENT_BUDGET_BYTES);
  assert.equal(openCheckpoint(claim).ok, true);
  assert.equal(openCheque(`${cheque.frame}x`).ok, false);
});
