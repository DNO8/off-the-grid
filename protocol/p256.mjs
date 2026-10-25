import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign,
  verify,
} from "node:crypto";

// NIST P-256. p % 4 == 3, so square roots are a^((p+1)/4).
const P = (1n << 256n) - (1n << 224n) + (1n << 192n) + (1n << 96n) - 1n;
const N = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;
const B = 0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604bn;

function mod(a, m) {
  const r = a % m;
  return r >= 0n ? r : r + m;
}

function modPow(base, exp, m) {
  let result = 1n;
  let b = mod(base, m);
  let e = exp;
  while (e > 0n) {
    if (e & 1n) result = mod(result * b, m);
    b = mod(b * b, m);
    e >>= 1n;
  }
  return result;
}

function bufferToBigInt(buf) {
  if (buf.length === 0) return 0n;
  return BigInt(`0x${Buffer.from(buf).toString("hex")}`);
}

function fixed32(n) {
  if (n < 0n || n >= 1n << 256n) throw new Error("field");
  return Buffer.from(n.toString(16).padStart(64, "0"), "hex");
}

function leftPad32(buf) {
  if (buf.length > 32) throw new Error("field");
  if (buf.length === 32) return Buffer.from(buf);
  return Buffer.concat([Buffer.alloc(32 - buf.length), buf]);
}

export function compressPublicKey(publicKey) {
  const jwk = publicKey.export({ format: "jwk" });
  const x = leftPad32(Buffer.from(jwk.x, "base64url"));
  const y = leftPad32(Buffer.from(jwk.y, "base64url"));
  const prefix = (y[31] & 1) === 0 ? 0x02 : 0x03;
  return Buffer.concat([Buffer.from([prefix]), x]);
}

function decompressPoint(compressed) {
  if (!Buffer.isBuffer(compressed) || compressed.length !== 33) {
    throw new Error("pubkey");
  }
  const prefix = compressed[0];
  if (prefix !== 0x02 && prefix !== 0x03) throw new Error("pubkey");
  const x = bufferToBigInt(compressed.subarray(1, 33));
  if (x >= P) throw new Error("pubkey");
  const y2 = mod(modPow(x, 3n, P) - 3n * x + B, P);
  let y = modPow(y2, (P + 1n) / 4n, P);
  if (mod(y * y, P) !== y2) throw new Error("pubkey");
  const odd = (y & 1n) === 1n;
  if (odd !== (prefix === 0x03)) y = mod(-y, P);
  return { x, y };
}

export function publicKeyFromCompressed(compressed) {
  try {
    const { x, y } = decompressPoint(Buffer.from(compressed));
    return createPublicKey({
      key: {
        kty: "EC",
        crv: "P-256",
        x: fixed32(x).toString("base64url"),
        y: fixed32(y).toString("base64url"),
      },
      format: "jwk",
    });
  } catch {
    return null;
  }
}

export function isLowS(signature) {
  if (!Buffer.isBuffer(signature) || signature.length !== 64) return false;
  const r = bufferToBigInt(signature.subarray(0, 32));
  const s = bufferToBigInt(signature.subarray(32));
  return r > 0n && r < N && s > 0n && s <= N / 2n;
}

export function normalizeLowS(signature) {
  if (!Buffer.isBuffer(signature) || signature.length !== 64) throw new Error("sig");
  const r = bufferToBigInt(signature.subarray(0, 32));
  let s = bufferToBigInt(signature.subarray(32));
  if (r <= 0n || r >= N || s <= 0n || s >= N) throw new Error("sig");
  if (s > N / 2n) s = N - s;
  return Buffer.concat([fixed32(r), fixed32(s)]);
}

export function signP256(body, privateKey) {
  const raw = sign("sha256", body, { key: privateKey, dsaEncoding: "ieee-p1363" });
  return normalizeLowS(raw);
}

export function verifyP256(body, signature, compressed) {
  if (!isLowS(signature)) return false;
  const key = publicKeyFromCompressed(compressed);
  if (!key) return false;
  return verify(
    "sha256",
    body,
    { key, dsaEncoding: "ieee-p1363" },
    signature,
  );
}

export function generateIdentity() {
  const { privateKey, publicKey } = generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
  });
  return { privateKey, publicKey, compressed: compressPublicKey(publicKey) };
}

export function identityFromJwk(jwk) {
  const privateKey = createPrivateKey({ key: jwk, format: "jwk" });
  const publicKey = createPublicKey(privateKey);
  return { privateKey, publicKey, compressed: compressPublicKey(publicKey) };
}

export function flipS(signature) {
  const r = signature.subarray(0, 32);
  let s = bufferToBigInt(signature.subarray(32));
  s = N - s;
  return Buffer.concat([Buffer.from(r), fixed32(s)]);
}
