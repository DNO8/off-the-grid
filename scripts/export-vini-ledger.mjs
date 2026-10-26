import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { ledgerRows } from "./offline-ledger-api.mjs";

const source = process.env.SOZU_VINI_LOG;
if (!source) throw new Error("Set SOZU_VINI_LOG to the local finalized-event log");
const destination = fileURLToPath(new URL("../docs/evidence/vini-testnet-ledger.jsonl", import.meta.url));
const staticApi = fileURLToPath(new URL("../landing-sozu/public/api/offline/ledger", import.meta.url));
if (source === destination) throw new Error("Source and destination must differ");
const rows = ledgerRows(readFileSync(source, "utf8"));
mkdirSync(dirname(destination), { recursive: true });
writeFileSync(destination, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`);
mkdirSync(dirname(staticApi), { recursive: true });
writeFileSync(staticApi, `${JSON.stringify({ network: "testnet", count: rows.length, rows })}\n`);
console.log(`Exported ${rows.length} finalized testnet rows to ${destination}`);
