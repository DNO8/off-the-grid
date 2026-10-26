import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createWitness } from "../protocol/mesh.mjs";
import { saveWitnessState } from "./witness-state.mjs";

const logPath = process.env.SOZU_VINI_LOG;
const statePath = process.env.SOZU_VINI_STATE;
if (!logPath || !statePath) throw new Error("Set SOZU_VINI_LOG and SOZU_VINI_STATE outside Git");
const rows = readFileSync(logPath, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line));
const noteHashes = rows.filter((row) =>
  ((row.type === "settle" && row.ok) || (row.type === "duplicate" && row.reason === "note-used")) &&
  /^[a-f0-9]{32}$/.test(row.noteId ?? ""))
  .map((row) => createHash("sha256").update(Buffer.from(row.noteId, "hex")).digest("hex"));
const witness = createWitness({ network: 1, vault: Buffer.alloc(32, 1), noteHashes: [...new Set(noteHashes)] });
saveWitnessState(statePath, witness);
console.log(`Rebuilt ${witness.noteHashes.size} confirmed note hashes in local witness state`);
