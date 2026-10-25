import { createHash } from "node:crypto";
import { openCheque } from "./cheque.mjs";
import { openCheckpoint } from "./checkpoint.mjs";
import { settleCheque } from "./vault.mjs";

export const WITNESS_PACKET_BYTES = 184;

export function createWitness({ network, vault, noteHashes = [], checkpointKey = null }) {
  const id = Buffer.from(vault);
  if (id.length !== 32) throw new Error("vault");
  if (!noteHashes.every((hash) => /^[a-f0-9]{64}$/.test(hash))) throw new Error("note-hash");
  const key = checkpointKey == null ? null : Buffer.from(checkpointKey);
  if (key && key.length !== 33) throw new Error("device-key");
  return { network, vault: id, noteHashes: new Set(noteHashes), checkpointKey: key };
}

export function witnessSnapshot(witness) {
  return {
    network: witness.network,
    vaultHex: witness.vault.toString("hex"),
    noteHashes: [...witness.noteHashes].sort(),
  };
}

export function recordWitnessCheckpoint(witness, checkpointFrame) {
  const checkpoint = openCheckpoint(checkpointFrame);
  if (!checkpoint.ok) return { ok: false, reason: checkpoint.reason };
  if (checkpoint.network !== witness.network) return { ok: false, reason: "network" };
  if (!checkpoint.vaultPrefix.equals(witness.vault.subarray(0, 8))) {
    return { ok: false, reason: "vault" };
  }
  if (!witness.checkpointKey?.equals(checkpoint.deviceKey)) {
    return { ok: false, reason: "device-key" };
  }
  return { ok: true, recorded: rememberNote(witness, checkpoint.noteId) };
}

// Call only with a finalized contract outcome, never with a simulation preview.
export function recordWitnessChainOutcome(witness, chequeFrame, outcome) {
  const cheque = openCheque(chequeFrame);
  if (!cheque.ok) return { ok: false, reason: cheque.reason };
  if (cheque.network !== witness.network) return { ok: false, reason: "network" };
  if (!cheque.vault.equals(witness.vault)) return { ok: false, reason: "vault" };
  if (!outcome.ok && outcome.reason !== "note-used") return { ok: false, reason: "unconfirmed" };
  return { ok: true, recorded: rememberNote(witness, cheque.noteId) };
}

export function inspectWitnessCheque(witness, chequeFrame) {
  const cheque = openCheque(chequeFrame);
  if (!cheque.ok) return { ok: false, reason: cheque.reason };
  if (cheque.network !== witness.network) return { ok: false, reason: "network" };
  if (!cheque.vault.equals(witness.vault)) return { ok: false, reason: "vault" };
  return witness.noteHashes.has(noteHash(cheque.noteId))
    ? { ok: false, reason: "note-used" }
    : { ok: true, status: "pending" };
}

function noteHash(noteId) {
  return createHash("sha256").update(noteId).digest("hex");
}

function rememberNote(witness, noteId) {
  const hash = noteHash(noteId);
  const recorded = !witness.noteHashes.has(hash);
  witness.noteHashes.add(hash);
  return recorded;
}

// Transport padding lives outside the signed SOZU2 frame. The checkpoint layout stays 131 bytes.
export function checkpointPacket(frame) {
  if (!openCheckpoint(frame).ok) return null;
  const bytes = Buffer.from(frame, "utf8");
  if (bytes.length > WITNESS_PACKET_BYTES) return null;
  const packet = Buffer.alloc(WITNESS_PACKET_BYTES);
  bytes.copy(packet);
  return packet;
}

export function checkpointFromPacket(packet) {
  if (!Buffer.isBuffer(packet) || packet.length !== WITNESS_PACKET_BYTES) return null;
  const end = packet.indexOf(0);
  if (end < 0) return null;
  for (let index = end; index < packet.length; index++) {
    if (packet[index] !== 0) return null;
  }
  const frame = packet.subarray(0, end).toString("utf8");
  return openCheckpoint(frame).ok ? frame : null;
}

// A phone keeps the cheque it was shown, and the checkpoints it is carrying.
// encounter() is one meeting. It copies checkpoints only. Distance is not this module.

export function createPhone({ id, network, vault, identity, account }) {
  return {
    id,
    network,
    vault: Buffer.from(vault),
    identity,
    account: Buffer.from(account),
    ledger: new Map(),
    carrying: new Set(),
  };
}

export function acceptPayment(phone, chequeFrame, now) {
  const cheque = openCheque(chequeFrame);
  if (!cheque.ok) return cheque;
  if (cheque.network !== phone.network) return { ok: false, reason: "network" };
  if (!cheque.vault.equals(phone.vault)) return { ok: false, reason: "vault" };
  if (BigInt(now) > cheque.expiry) return { ok: false, reason: "expired" };
  const id = cheque.noteId.toString("hex");
  const row = phone.ledger.get(id);
  if (row?.status === "settled" || row?.status === "rejected" || row?.frame) {
    return { ok: false, reason: "note-used" };
  }
  if (row?.status === "heard") {
    row.status = "conflict";
    row.frame = chequeFrame;
    return { ok: true, status: "conflict" };
  }
  phone.ledger.set(id, { status: "pending", frame: chequeFrame });
  return { ok: true, status: "pending" };
}

export function encounter(left, right) {
  const frames = new Set([...left.carrying, ...right.carrying]);
  left.carrying = new Set();
  right.carrying = new Set();
  for (const claim of frames) {
    applyClaim(left, claim);
    applyClaim(right, claim);
  }
}

export function connectPhone(vault, phone, now) {
  const result = { settled: [], rejected: [], reward: 0n };
  const rows = [...phone.ledger.values()].filter(
    (row) => row.frame && (row.status === "pending" || row.status === "conflict"),
  );
  const ledgerSequence = vault.ledgerSequence + 1;
  let wrote = false;
  for (const row of rows) {
    const outcome = settleCheque(vault, row.frame, {
      account: phone.account,
      privateKey: phone.identity.privateKey,
      deviceKey: phone.identity.compressed,
      now,
      ledgerSequence,
    });
    const cheque = openCheque(row.frame);
    const noteId = cheque.ok ? cheque.noteId.toString("hex") : null;
    if (!outcome.ok) {
      result.rejected.push({ noteId, reason: outcome.reason });
      if (outcome.reason !== "note-used") row.status = "rejected";
      continue;
    }
    wrote = true;
    result.settled.push(outcome.noteId);
    result.reward += outcome.fee;
  }
  if (wrote) vault.ledgerSequence = ledgerSequence;
  pullChain(vault, phone);
  return result;
}

export function partyPayments(phone) {
  const payments = [];
  for (const [noteId, row] of phone.ledger) {
    if (!row.frame) continue;
    const cheque = openCheque(row.frame);
    if (!cheque.ok) continue;
    payments.push({
      noteId,
      status: row.status,
      amount: cheque.amount,
      fee: cheque.fee,
    });
  }
  return payments.sort((a, b) => a.noteId.localeCompare(b.noteId));
}

export function meshLedger(phone) {
  const notes = [];
  for (const [noteId, row] of phone.ledger) {
    if (row.status !== "heard" && row.status !== "conflict" && row.status !== "settled") {
      continue;
    }
    notes.push({
      noteId,
      status: row.status,
      ledgerSequence: row.ledgerSequence ?? null,
      reward: row.reward == null ? null : row.reward.toString(),
    });
  }
  return notes.sort((a, b) => a.noteId.localeCompare(b.noteId));
}

function pullChain(vault, phone) {
  for (const claim of vault.frames.values()) applyClaim(phone, claim);
  for (const [id, row] of [...phone.ledger.entries()]) {
    const spent = vault.spent.get(id);
    if (spent) {
      row.status = "settled";
      row.ledgerSequence = spent.ledgerSequence;
      row.reward = spent.fee;
      row.claimFrame = vault.frames.get(id);
      continue;
    }
    if (row.status === "heard") phone.ledger.delete(id);
    else if (row.status === "conflict") {
      if (row.frame) row.status = "pending";
      else phone.ledger.delete(id);
      row.claimFrame = undefined;
    }
  }
  phone.carrying = new Set(vault.frames.values());
}

function applyClaim(phone, text) {
  const claim = openCheckpoint(text);
  if (!claim.ok || claim.network !== phone.network) return;
  if (!claim.vaultPrefix.equals(phone.vault.subarray(0, 8))) return;
  const id = claim.noteId.toString("hex");
  const row = phone.ledger.get(id);
  if (row?.status === "settled") {
    if (text === row.claimFrame) phone.carrying.add(text);
    return;
  }
  if (row?.frame) {
    row.status = "conflict";
    row.claimFrame = text;
  } else if (row) {
    row.claimFrame = text;
  } else {
    phone.ledger.set(id, { status: "heard", claimFrame: text });
  }
  const current = phone.ledger.get(id);
  current.ledgerSequence = claim.ledgerSequence;
  current.reward = claim.reward;
  if (current.status !== "conflict") current.status = current.frame ? "conflict" : "heard";
  phone.carrying.add(text);
}
