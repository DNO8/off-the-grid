export const PHONE_TEXT = "sozu-text-1";

// bitchat fragments private messages into packets of about 184 bytes.
// This test stays inside one packet so a failure is the link, not fragmentation.
export const FRAGMENT_BUDGET_BYTES = 184;

export function phoneTextPayload() {
  return PHONE_TEXT;
}

export function checkPlainText(value) {
  if (typeof value !== "string" || value.length === 0) {
    return { ok: false, reason: "empty" };
  }
  if (value.startsWith("SOZU1:")) {
    return { ok: false, reason: "cheque-prefix" };
  }
  if (Buffer.byteLength(value, "utf8") > FRAGMENT_BUDGET_BYTES) {
    return { ok: false, reason: "over-fragment" };
  }
  return { ok: true };
}
