import { createHash } from "node:crypto";
import { readU64, writeFixed, writeU64 } from "./codec.mjs";
import { frame, unframe } from "./frame.mjs";
import { signP256, verifyP256 } from "./p256.mjs";

// Cheque body, 179 bytes. SHA-256 once over this body. Signature is raw r||s, 64 bytes, low-S, and is not hashed.
// 0 version u8 = 1
// 1 network u8 (1 = testnet)
// 2 vault 32
// 34 note id 16
// 50 amount u64 le (USDC minor units, 7 decimals)
// 58 fee u64 le
// 66 cap u64 le
// 74 expiry unix seconds u64 le
// 82 payee 32 (classic account)
// 114 owner 32 (classic account that deposited)
// 146 device key 33 (compressed P-256)
export const CHEQUE_BODY_BYTES = 179;
export const CHEQUE_SIGNATURE_BYTES = 64;
export const CHEQUE_WIRE_BYTES = CHEQUE_BODY_BYTES + CHEQUE_SIGNATURE_BYTES;
export const NETWORK_TESTNET = 1;
export const MAX_GOSSIP_FEE = 0xffffffffn;
export const USDC = 10_000_000n;
export const DEMO_FEE = 100_000n;

export function digestCheque(body) {
  return createHash("sha256").update(body).digest();
}

export function encodeChequeBody(fields) {
  const body = Buffer.alloc(CHEQUE_BODY_BYTES);
  body[0] = 1;
  body[1] = fields.network;
  writeFixed(body, 2, fields.vault, 32);
  writeFixed(body, 34, fields.noteId, 16);
  writeU64(body, 50, fields.amount);
  writeU64(body, 58, fields.fee);
  writeU64(body, 66, fields.cap);
  writeU64(body, 74, fields.expiry);
  writeFixed(body, 82, fields.payee, 32);
  writeFixed(body, 114, fields.owner, 32);
  writeFixed(body, 146, fields.deviceKey, 33);
  return body;
}

export function issueCheque(fields, privateKey, deviceKey) {
  const body = encodeChequeBody({ ...fields, deviceKey });
  const signature = signP256(body, privateKey);
  const wire = Buffer.concat([body, signature]);
  return {
    body,
    signature,
    digest: digestCheque(body),
    wire,
    frame: frame("SOZU1:", wire),
  };
}

export function openCheque(frameOrWire) {
  const wire = Buffer.isBuffer(frameOrWire)
    ? frameOrWire
    : unframe(frameOrWire, "SOZU1:");
  if (!wire || wire.length !== CHEQUE_WIRE_BYTES) {
    return { ok: false, reason: "frame" };
  }
  const body = wire.subarray(0, CHEQUE_BODY_BYTES);
  const signature = wire.subarray(CHEQUE_BODY_BYTES);
  if (body[0] !== 1) return { ok: false, reason: "frame" };
  const deviceKey = Buffer.from(body.subarray(146, 179));
  if (!verifyP256(body, signature, deviceKey)) {
    return { ok: false, reason: "bad-signature" };
  }
  const amount = readU64(body, 50);
  const fee = readU64(body, 58);
  const cap = readU64(body, 66);
  if (amount <= 0n) return { ok: false, reason: "amount" };
  if (fee < 0n || fee > MAX_GOSSIP_FEE) return { ok: false, reason: "fee" };
  if (amount + fee > cap) return { ok: false, reason: "cap" };
  return {
    ok: true,
    network: body[1],
    vault: Buffer.from(body.subarray(2, 34)),
    noteId: Buffer.from(body.subarray(34, 50)),
    amount,
    fee,
    cap,
    expiry: readU64(body, 74),
    payee: Buffer.from(body.subarray(82, 114)),
    owner: Buffer.from(body.subarray(114, 146)),
    deviceKey,
    signature: Buffer.from(signature),
    digest: digestCheque(body),
  };
}
