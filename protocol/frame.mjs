const ALPHABET = /^[A-Za-z0-9_-]+$/;

export function frame(prefix, payload) {
  if (prefix !== "SOZU1:" && prefix !== "SOZU2:") throw new Error("prefix");
  return prefix + Buffer.from(payload).toString("base64url");
}

export function unframe(text, prefix) {
  if (typeof text !== "string" || !text.startsWith(prefix)) return null;
  const encoded = text.slice(prefix.length);
  if (!ALPHABET.test(encoded)) return null;
  const bytes = Buffer.from(encoded, "base64url");
  if (bytes.length === 0 || frame(prefix, bytes) !== text) return null;
  return bytes;
}
