import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { issueCheckpoint, openCheckpoint } from "../protocol/checkpoint.mjs";
import { checkpointFromPacket, checkpointPacket } from "../protocol/mesh.mjs";
import { identityFromJwk } from "../protocol/p256.mjs";

const vectorPath = new URL("../firmware/witness/vector/checkpoint-184.json", import.meta.url);
const headerPath = new URL("../firmware/witness/include/checkpoint_packet.h", import.meta.url);
mkdirSync(new URL("../firmware/witness/vector/", import.meta.url), { recursive: true });
mkdirSync(new URL("../firmware/witness/include/", import.meta.url), { recursive: true });

if (!existsSync(vectorPath)) {
  const chequeVector = JSON.parse(readFileSync(new URL("../protocol/cheque-vector.json", import.meta.url)));
  const identity = identityFromJwk(chequeVector.jwk);
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
  writeFileSync(vectorPath, `${JSON.stringify({
    note: "Synthetic test-only checkpoint referencing the first settled testnet note id; the vault and signing key are test fixtures, not the deployed contract.",
    frame,
    packetHex: packet.toString("hex"),
  }, null, 2)}\n`);
}

const vector = JSON.parse(readFileSync(vectorPath));
const packet = Buffer.from(vector.packetHex, "hex");
if (packet.length !== 184 || checkpointFromPacket(packet) !== vector.frame || !openCheckpoint(vector.frame).ok) {
  throw new Error("Frozen witness vector is invalid");
}
const rows = [];
for (let index = 0; index < packet.length; index += 16) {
  rows.push(`  ${[...packet.subarray(index, index + 16)].map((byte) => `0x${byte.toString(16).padStart(2, "0")}`).join(", ")},`);
}
writeFileSync(headerPath, `#pragma once\n#include <stdint.h>\n\nstatic constexpr uint8_t kCheckpointPacket[184] = {\n${rows.join("\n")}\n};\n`);
console.log("Frozen 184-byte witness packet and generated firmware header are valid");
