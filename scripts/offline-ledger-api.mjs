import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const path = process.env.SOZU_VINI_LOG ?? resolve(fileURLToPath(new URL("../docs/evidence/vini-testnet-ledger.jsonl", import.meta.url)));
const port = Number(process.env.PORT ?? "3032");
const host = process.env.HOST ?? "127.0.0.1";

export function ledgerRows(text) {
  return text.split("\n").filter(Boolean).flatMap((line) => {
    const row = JSON.parse(line);
    if (!/^[a-f0-9]{64}$/.test(row.hash ?? "") || !["settle", "duplicate"].includes(row.type)) return [];
    return [{ at: row.at, type: row.type, windowMinutes: row.windowMinutes ?? null, noteId: row.noteId,
      owner: row.owner, settler: row.settler, source: row.source ?? row.settler,
      ok: row.ok, reason: row.reason ?? null, fee: row.fee,
      hash: row.hash, explorerUrl: `https://stellar.expert/explorer/testnet/tx/${row.hash}` }];
  });
}

if (process.argv[1]?.endsWith("offline-ledger-api.mjs")) {
  createServer((request, response) => {
    if (request.method !== "GET" || new URL(request.url, `http://${host}`).pathname !== "/api/offline/ledger") {
      response.writeHead(404).end();
      return;
    }
    try {
      const rows = ledgerRows(readFileSync(path, "utf8"));
      response.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      response.end(JSON.stringify({ network: "testnet", count: rows.length, rows }));
    } catch (error) {
      response.writeHead(500, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "ledger-unavailable" }));
    }
  }).listen(port, host, () => console.log(`offline ledger: http://${host}:${port}/api/offline/ledger`));
}
