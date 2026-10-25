import { randomBytes } from "node:crypto";
import { DEMO_FEE, issueCheque, NETWORK_TESTNET } from "../protocol/cheque.mjs";
import { generateIdentity } from "../protocol/p256.mjs";

// Supply the raw 32-byte Ed25519 account IDs behind the testnet G-addresses.
// The secret P-256 key exists only for this process; output is testnet-only.
const [ownerHex, firstPayeeHex, secondPayeeHex] = process.argv.slice(2);
if ([ownerHex, firstPayeeHex, secondPayeeHex].some((value) => !/^[0-9a-f]{64}$/i.test(value ?? ""))) {
  throw new Error("Expected three 32-byte hex account IDs: owner, first payee, second payee");
}

const identity = generateIdentity();
const noteId = randomBytes(16);
const fields = {
  network: NETWORK_TESTNET,
  vault: Buffer.alloc(32, 1),
  noteId,
  amount: 1_000_000n,
  fee: DEMO_FEE,
  cap: 1_100_000n,
  expiry: BigInt(Math.floor(Date.now() / 1000) + 6 * 3600),
  owner: Buffer.from(ownerHex, "hex"),
};
const first = issueCheque({ ...fields, payee: Buffer.from(firstPayeeHex, "hex") }, identity.privateKey, identity.compressed);
const second = issueCheque({ ...fields, payee: Buffer.from(secondPayeeHex, "hex") }, identity.privateKey, identity.compressed);
console.log(JSON.stringify({
  noteId: noteId.toString("hex"),
  deviceKey: identity.compressed.toString("hex"),
  expiry: fields.expiry.toString(),
  firstWire: first.wire.toString("hex"),
  secondWire: second.wire.toString("hex"),
}, null, 2));
