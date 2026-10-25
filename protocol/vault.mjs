import { openCheque } from "./cheque.mjs";
import { issueCheckpoint } from "./checkpoint.mjs";

// Stand-in for the Soroban vault. One internet upload commits here.
// The mesh never commits. It only carries the checkpoints this object stores.

export function createVault({ network, vault }) {
  const id = Buffer.from(vault);
  if (id.length !== 32) throw new Error("vault");
  return {
    network,
    vault: id,
    accounts: new Map(),
    spent: new Map(),
    frames: new Map(),
    fees: new Map(),
    ledgerSequence: 1000,
  };
}

export function deposit(vault, { owner, caller, deviceKey, collateral, lockedUntil }) {
  const accountId = hex(owner);
  if (!Buffer.from(owner).equals(Buffer.from(caller))) {
    return { ok: false, reason: "caller" };
  }
  if (vault.accounts.has(accountId)) return { ok: false, reason: "owner" };
  const locked = BigInt(lockedUntil);
  const amount = BigInt(collateral);
  if (amount <= 0n || locked < 0n) return { ok: false, reason: "amount" };
  vault.accounts.set(accountId, {
    owner: Buffer.from(owner),
    deviceKey: Buffer.from(deviceKey),
    previousDeviceKey: null,
    previousValidUntil: 0n,
    remaining: amount,
    lockedUntil: locked,
  });
  return { ok: true };
}

export function rotateDeviceKey(vault, { owner, caller, newDeviceKey }) {
  const account = vault.accounts.get(hex(owner));
  if (!account) return { ok: false, reason: "owner" };
  if (!account.owner.equals(Buffer.from(caller))) {
    return { ok: false, reason: "caller" };
  }
  const next = Buffer.from(newDeviceKey);
  if (next.equals(account.deviceKey)) return { ok: false, reason: "device-key" };
  account.previousDeviceKey = account.deviceKey;
  account.previousValidUntil = account.lockedUntil;
  account.deviceKey = next;
  return { ok: true, previousValidUntil: account.previousValidUntil };
}

export function withdrawAfterExpiry(vault, { owner, caller, now }) {
  const account = vault.accounts.get(hex(owner));
  if (!account) return { ok: false, reason: "owner" };
  if (!account.owner.equals(Buffer.from(caller))) {
    return { ok: false, reason: "caller" };
  }
  if (BigInt(now) <= account.lockedUntil) return { ok: false, reason: "locked" };
  const amount = account.remaining;
  account.remaining = 0n;
  return { ok: true, amount };
}

export function settleCheque(vault, chequeFrame, { account, privateKey, deviceKey, now, ledgerSequence }) {
  const cheque = openCheque(chequeFrame);
  if (!cheque.ok) return { ok: false, reason: cheque.reason, noteId: null };
  const noteId = hex(cheque.noteId);
  const reason = reject(vault, cheque, now);
  if (reason) return { ok: false, reason, noteId };
  const owner = vault.accounts.get(hex(cheque.owner));
  const frame = issueCheckpoint(
    {
      network: vault.network,
      vault: vault.vault,
      ledgerSequence,
      reward: cheque.fee,
      noteId: cheque.noteId,
    },
    privateKey,
    deviceKey,
  );
  owner.remaining -= cheque.amount + cheque.fee;
  const settler = hex(account);
  vault.spent.set(noteId, {
    noteId,
    fee: cheque.fee,
    amount: cheque.amount,
    payee: cheque.payee,
    settler: Buffer.from(account),
    ledgerSequence,
  });
  vault.frames.set(noteId, frame);
  vault.fees.set(settler, (vault.fees.get(settler) ?? 0n) + cheque.fee);
  return { ok: true, noteId, fee: cheque.fee, frame };
}

function reject(vault, cheque, now) {
  if (cheque.network !== vault.network) return "network";
  if (!cheque.vault.equals(vault.vault)) return "vault";
  if (BigInt(now) > cheque.expiry) return "expired";
  const account = vault.accounts.get(hex(cheque.owner));
  if (!account) return "owner";
  if (cheque.expiry > account.lockedUntil) return "lock";
  if (!deviceKeyAllowed(account, cheque.deviceKey, now)) return "device-key";
  if (vault.spent.has(hex(cheque.noteId))) return "note-used";
  if (cheque.amount + cheque.fee > account.remaining) return "collateral";
  return null;
}

function deviceKeyAllowed(account, deviceKey, now) {
  if (account.deviceKey.equals(deviceKey)) return true;
  return (
    account.previousDeviceKey !== null &&
    account.previousDeviceKey.equals(deviceKey) &&
    BigInt(now) <= account.previousValidUntil
  );
}

function hex(bytes) {
  return Buffer.from(bytes).toString("hex");
}
