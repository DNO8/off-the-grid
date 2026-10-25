import { readU32, writeFixed, writeU32 } from "./codec.mjs";
import { frame, unframe } from "./frame.mjs";
import { signP256, verifyP256 } from "./p256.mjs";

// One settled note per message, so the framed text fits in one bitchat fragment (184 bytes).
// Signed body is 67 bytes. Signature is 64. Wire is 131.
// 0 version u8 = 1
// 1 network u8
// 2 vault prefix 8 (first 8 bytes of the 32-byte vault id)
// 10 ledger sequence u32 le
// 14 reward u32 le (this note's fee, minor units)
// 18 note id 16
// 34 settler device key 33
// 67 signature 64
export const CHECKPOINT_BODY_BYTES = 67;
export const CHECKPOINT_WIRE_BYTES = 131;

export function vaultPrefix(vault) {
  const id = Buffer.from(vault);
  if (id.length !== 32) throw new Error("vault");
  return Buffer.from(id.subarray(0, 8));
}

export function issueCheckpoint(fields, privateKey, deviceKey) {
  const body = Buffer.alloc(CHECKPOINT_BODY_BYTES);
  body[0] = 1;
  body[1] = fields.network;
  writeFixed(body, 2, vaultPrefix(fields.vault), 8);
  writeU32(body, 10, fields.ledgerSequence);
  writeU32(body, 14, fields.reward);
  writeFixed(body, 18, fields.noteId, 16);
  writeFixed(body, 34, deviceKey, 33);
  const signature = signP256(body, privateKey);
  return frame("SOZU2:", Buffer.concat([body, signature]));
}

export function openCheckpoint(text) {
  const wire = unframe(text, "SOZU2:");
  if (!wire || wire.length !== CHECKPOINT_WIRE_BYTES) {
    return { ok: false, reason: "frame" };
  }
  const body = wire.subarray(0, CHECKPOINT_BODY_BYTES);
  const signature = wire.subarray(CHECKPOINT_BODY_BYTES);
  if (body[0] !== 1) return { ok: false, reason: "frame" };
  const deviceKey = Buffer.from(body.subarray(34, 67));
  if (!verifyP256(body, signature, deviceKey)) {
    return { ok: false, reason: "bad-signature" };
  }
  return {
    ok: true,
    network: body[1],
    vaultPrefix: Buffer.from(body.subarray(2, 10)),
    ledgerSequence: readU32(body, 10),
    reward: BigInt(readU32(body, 14)),
    noteId: Buffer.from(body.subarray(18, 34)),
    deviceKey,
  };
}
