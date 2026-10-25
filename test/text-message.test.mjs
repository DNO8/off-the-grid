import assert from "node:assert/strict";
import test from "node:test";
import {
  FRAGMENT_BUDGET_BYTES,
  checkPlainText,
  phoneTextPayload,
} from "../protocol/text-message.mjs";

test("the phone test sends one agreed string", () => {
  assert.equal(phoneTextPayload(), "sozu-text-1");
});

test("the phone test is plain text, not a cheque", () => {
  assert.deepEqual(checkPlainText(phoneTextPayload()), { ok: true });
  assert.deepEqual(checkPlainText("SOZU1:aa"), {
    ok: false,
    reason: "cheque-prefix",
  });
  assert.deepEqual(checkPlainText("SOZU2:aa"), {
    ok: false,
    reason: "sync-prefix",
  });
  assert.deepEqual(checkPlainText(""), { ok: false, reason: "empty" });
});

test("the phone test fits in one bitchat fragment", () => {
  const bytes = Buffer.byteLength(phoneTextPayload(), "utf8");
  assert.ok(bytes < FRAGMENT_BUDGET_BYTES);
  assert.equal(bytes, 11);
});
