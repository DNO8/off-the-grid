export function writeU32(buf, offset, value) {
  const v = toUnsigned(value, 0xffffffffn, "u32");
  buf.writeUInt32LE(Number(v), offset);
}

export function writeU64(buf, offset, value) {
  const v = toUnsigned(value, 0xffffffffffffffffn, "u64");
  buf.writeUInt32LE(Number(v & 0xffffffffn), offset);
  buf.writeUInt32LE(Number(v >> 32n), offset + 4);
}

export function readU32(buf, offset) {
  return buf.readUInt32LE(offset);
}

export function readU64(buf, offset) {
  const lo = BigInt(buf.readUInt32LE(offset));
  const hi = BigInt(buf.readUInt32LE(offset + 4));
  return (hi << 32n) + lo;
}

export function writeFixed(buf, offset, bytes, length) {
  const src = Buffer.from(bytes);
  if (src.length !== length) throw new Error(`want ${length} bytes`);
  src.copy(buf, offset);
  return src;
}

function toUnsigned(value, max, label) {
  const v = typeof value === "bigint" ? value : BigInt(value);
  if (v < 0n || v > max) throw new Error(label);
  return v;
}
