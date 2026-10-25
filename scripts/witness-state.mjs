import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { createWitness, witnessSnapshot } from "../protocol/mesh.mjs";

export function loadWitnessState(path, { network, vault }) {
  if (!existsSync(path)) return createWitness({ network, vault });
  const saved = JSON.parse(readFileSync(path, "utf8"));
  if (saved.network !== network) throw new Error("network");
  if (saved.vaultHex !== Buffer.from(vault).toString("hex")) throw new Error("vault");
  return createWitness({ network, vault, noteHashes: saved.noteHashes });
}

export function saveWitnessState(path, witness) {
  mkdirSync(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporaryPath, `${JSON.stringify(witnessSnapshot(witness), null, 2)}\n`, { flag: "wx" });
    renameSync(temporaryPath, path);
  } finally {
    if (existsSync(temporaryPath)) unlinkSync(temporaryPath);
  }
}
