import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ledgerRows } from "../scripts/offline-ledger-api.mjs";

test("offline ledger exposes confirmed tx links without local wallet secrets", () => {
  const hash = "a".repeat(64);
  const rows = ledgerRows([
    JSON.stringify({ type: "deposit", hash: "b".repeat(64), secret: "never-publish" }),
    JSON.stringify({ type: "settle", at: "2026-10-26T00:00:00Z", hash,
      noteId: "c".repeat(32), ok: true, fee: "100000", secret: "never-publish" }),
  ].join("\n"));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].explorerUrl, `https://stellar.expert/explorer/testnet/tx/${hash}`);
  assert.equal(JSON.stringify(rows).includes("never-publish"), false);
});

test("published ledger snapshot contains every exported testnet hash", () => {
  const evidence = readFileSync(new URL("../docs/evidence/vini-testnet-ledger.jsonl", import.meta.url), "utf8");
  const endpoint = JSON.parse(readFileSync(new URL("../landing-sozu/public/api/offline/ledger", import.meta.url), "utf8"));
  const rows = ledgerRows(evidence);
  assert.equal(endpoint.network, "testnet");
  assert.equal(endpoint.count, rows.length);
  assert.deepEqual(endpoint.rows.map((row) => row.hash), rows.map((row) => row.hash));
  assert.ok(rows.length > 0);
  assert.equal(/wallet\.secret|BEGIN PRIVATE KEY|"secret"/i.test(evidence + JSON.stringify(endpoint)), false);
  assert.equal(new Set(rows.map((row) => row.hash)).size, rows.length);
  for (const minutes of [8, 16]) {
    const window = rows.filter((row) => row.windowMinutes === minutes);
    assert.ok(window.length > 0);
    assert.equal(new Set(window.map((row) => row.settler)).size, 1);
    assert.ok(window.every((row) => row.ok && row.fee === "100000"));
  }
  assert.ok(rows.some((row) => row.reason === "note-used" && row.fee === "0"));
});
