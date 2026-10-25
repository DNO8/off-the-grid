import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { issueCheckpoint, openCheckpoint } from "../protocol/checkpoint.mjs";
import { checkpointFromPacket, checkpointPacket } from "../protocol/mesh.mjs";
import { generateIdentity } from "../protocol/p256.mjs";

test("a signed SOZU2 checkpoint occupies one 184-byte witness packet", () => {
  const identity = generateIdentity();
  const frame = issueCheckpoint(
    {
      network: 1,
      vault: Buffer.alloc(32, 1),
      ledgerSequence: 5387073,
      reward: 100_000n,
      noteId: Buffer.from("8ca3b1bdc7e642d2bb9e221c8b127e8d", "hex"),
    },
    identity.privateKey,
    identity.compressed,
  );

  const packet = checkpointPacket(frame);
  assert.equal(Buffer.byteLength(frame), 181);
  assert.equal(packet.length, 184);
  assert.equal(packet.subarray(0, 181).toString("utf8"), frame);
  assert.deepEqual(packet.subarray(181), Buffer.alloc(3));
  assert.equal(checkpointFromPacket(packet), frame);

  const alteredPadding = Buffer.from(packet);
  alteredPadding[183] = 1;
  assert.equal(checkpointFromPacket(alteredPadding), null);
});

test("the committed packet vector carries the settled testnet note", () => {
  const vector = JSON.parse(readFileSync(new URL("../firmware/witness/vector/checkpoint-184.json", import.meta.url)));
  const packet = Buffer.from(vector.packetHex, "hex");
  assert.equal(packet.length, 184);
  assert.equal(checkpointFromPacket(packet), vector.frame);
  const claim = openCheckpoint(vector.frame);
  assert.equal(claim.ok, true);
  assert.equal(claim.ledgerSequence, 5387073);
  assert.equal(claim.reward, 100_000n);
  assert.equal(claim.noteId.toString("hex"), "8ca3b1bdc7e642d2bb9e221c8b127e8d");
  assert.equal(Object.hasOwn(claim, "amount"), false);
});
