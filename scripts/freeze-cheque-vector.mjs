import { writeFileSync, existsSync } from "node:fs";
import { generateIdentity } from "../protocol/p256.mjs";
import { issueCheque, NETWORK_TESTNET } from "../protocol/cheque.mjs";

const path = new URL("../protocol/cheque-vector.json", import.meta.url);
if (existsSync(path)) {
  console.log("protocol/cheque-vector.json already frozen");
  process.exit(0);
}

const identity = generateIdentity();
const issued = issueCheque(
  {
    network: NETWORK_TESTNET,
    vault: Buffer.alloc(32, 1),
    noteId: Buffer.alloc(16, 2),
    amount: 10_000_000n,
    fee: 100_000n,
    cap: 10_100_000n,
    expiry: 1_700_003_600n,
    payee: Buffer.alloc(32, 3),
    owner: Buffer.alloc(32, 4),
  },
  identity.privateKey,
  identity.compressed,
);

writeFileSync(
  path,
  `${JSON.stringify(
    {
      note: "Test-only P-256 key. It controls no funds.",
      jwk: identity.privateKey.export({ format: "jwk" }),
      bodyHex: issued.body.toString("hex"),
      digestHex: issued.digest.toString("hex"),
      publicKeyHex: identity.compressed.toString("hex"),
      signatureHex: issued.signature.toString("hex"),
      frame: issued.frame,
    },
    null,
    2,
  )}\n`,
);
console.log("froze protocol/cheque-vector.json");
