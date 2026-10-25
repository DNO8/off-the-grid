# PRD: Ready to code

Status: ready for an agent. 2026-10-25 18:08 UTC. Feature: Sozu Offline demo `cmvnw3wsl005ykw078w6baia9`. Product: `hack-meridian`.

Spoken line, unchanged: **Offline Stellar payments. A second spend of the same note fails on chain.**

Parents: [ADR 0002](../adr/0002-recovery-and-mesh-ledger.md), [ADR 0003](../adr/0003-witness-apk-and-open.md), [APK v0.1](apk-v0.1.md). The clock is [timeline](timeline.md). The testnet gate is 22:30 UTC.

## Problem

A merchant takes a payment with no signal. Later, the first phone that reaches the internet settles that note and keeps a fee. A second cheque for the same note fails. The room can already see this in `npm test`. Testnet has not rejected a second spend yet, and no phone has been flashed.

## Goals

- Explorer links for one accepted settlement and one rejected second spend of the same note, using the frozen cheque bytes.
- The settler of the first cheque is credited 0.01 USDC. The second settler is credited nothing.
- The pay screen can say pending, heard, or settled. A second spend says "note already used".

## Non-goals

SPP, a Groth16 proof, a new cheque field, a new checkpoint field, iOS, a passkey account, a WebView of the Sozu PWA, the ESP32 in the video, a recovery screen, `fraud_proof`, and any sentence that says a double-spend is impossible. Presence pings and the mesh screen wait until the explorer links exist.

## Solution

The laptop vault is a Soroban contract that behaves like `settleCheque`. Phones carry `SOZU1:` and `SOZU2:` as ordinary bitchat texts. The APK then shows the states the sim already returns.

## Requirements

Canonical copies live as requirement rows on the feature.

- When `settleCheque` accepts the first cheque for a note id, the system shall subtract amount plus fee from the owner's remaining balance and credit that fee to the settler.
- When a later cheque for a note id already in `spent` is submitted, the system shall reject it with reason `note-used` and shall credit no fee.
- When amount plus fee exceeds remaining collateral, the system shall reject that cheque with reason `collateral` and shall leave an earlier spent note spent.
- When a phone has accepted a cheque and has not seen a checkpoint, `partyPayments` shall report `pending` and `meshLedger` shall omit that note.
- When a phone that never connected receives a checkpoint through `encounter`, `meshLedger` shall report `heard` and `partyPayments` shall omit the amount.
- The contract shall accept `protocol/cheque-vector.json` and shall not define a second byte layout.
- The pay screen shall use the words pending, heard, and settled, and the words "note already used" for a second spend.
- If `sozu-text-1` has not arrived by 18:50 UTC, the mesh build shall stop.

## Rollout

1. Contract. Testnet `deposit` and `settle`. First cheque pays. Second cheque for that note id returns `note-used`.
2. Glue. A phone sends the framed cheque as a bitchat private message. The phone that connects submits it and gossips the checkpoint.
3. Screens. Mesh, pay, and result, as in APK v0.1, after the explorer links exist.

## Open questions

None for this cut. The witness in the video is a phone on Wi-Fi until the ESP32 exchanges one 184-byte packet. Sozu login on the APK is skipped if it is not on the build. The device key already stored at deposit signs the cheque.

## Agent PRD

Machine-facing. Humans: the sections above are the spec. The sim is the spec. Do not invent a second layout.

### Implementation decisions

`protocol/` is the behavior. `contracts/` does not exist yet. Add a Soroban crate there. Leave the JavaScript in place. The contract copies it.

Public surface already in the repo:

- `issueCheque` / `openCheque` frame with prefix `SOZU1:`. Body is 179 bytes. Signature is 64 bytes, raw r||s, low-S, and is not part of the hash. Digest is SHA-256 once over the body. Wire is 243 bytes. The framed text is base64url and occupies two bitchat fragments. Fields, in order: version u8 = 1, network u8 = 1 for testnet, vault 32, note id 16, amount u64 le, fee u64 le, cap u64 le, expiry u64 le, payee 32, owner 32, device key 33 compressed.
- `DEMO_FEE` is `100_000n`. `USDC` is `10_000_000n`. Demo fee is 0.01 USDC.
- `issueCheckpoint` / `openCheckpoint` frame with prefix `SOZU2:`. Signed body 67 bytes. Wire 131 bytes. Framed text fits one 184-byte fragment. No amount field. Vault prefix is the first 8 bytes of the vault id.
- `frame` accepts only those two prefixes.
- `deposit` stores owner, device key, remaining collateral, and `lockedUntil`. Caller must equal owner. Reason on failure: `caller`, `owner`, `amount`.
- `settleCheque` rejection reasons, in check order after a successful open: `network`, `vault`, `expired`, `owner`, `lock`, `device-key`, `note-used`, `collateral`. Open failures: `frame`, `bad-signature`, `amount`, `fee`, `cap`.
- On success, remaining falls by amount plus fee, `spent` records the note, and `fees` credits the settler account. A second call returns `note-used`.
- `connectPhone` settles each pending or conflict row. One bad cheque does not roll back a good one. Reward is the sum of fees on the rows that settled. A `note-used` row becomes `settled` after `pullChain`. Any other rejection sets that row to `rejected`.
- `acceptPayment` returns `pending`, or `conflict` if a checkpoint for that note is already on the phone, or `note-used` if the row is already settled, rejected, or has a frame.
- `encounter` copies checkpoints only. It does not copy cheques.
- `partyPayments` is the pay screen: notes this phone holds a cheque for, with amount and fee.
- `meshLedger` is the heard list: `heard`, `conflict`, or `settled`. No amount.
- `rotateDeviceKey` and `withdrawAfterExpiry` exist in the sim. They are not in this contract cut. The timeline drops them if the signature check is still open at 21:30 UTC.
- High-S is rejected. `verifyP256` takes the compressed 33-byte device key. Soroban `secp256r1_verify` takes a 65-byte uncompressed key, a 32-byte digest, and a 64-byte signature. The contract decompresses, then verifies. It does not hash the signature.

`protocol/cheque-vector.json` is the vector. A test-only key. No funds. The contract test submits those bytes.

Android, after the explorer links, and only after `sozu-text-1` has arrived: the fork at the pin in `forks.json`. Bluetooth code stays. Screens are the three in APK v0.1. Palette and RSSI buckets live in that PRD. A presence ping is a new text, not a cheque and not a checkpoint. A ping that carries an amount, a note id, or an account id is rejected and not drawn. That parser does not go in `MessageSpecialParser`.

### Testing decisions

Seam is the public functions in `protocol/vault.mjs` and `protocol/mesh.mjs`. Prior art is `test/mesh-ledger.test.mjs` and `test/cheque.test.mjs`. Expected values are literals and the frozen vector, not a reimplementation of the digest.

The contract's first test is: deposit, settle the vector's note, settle a second cheque with the same note id, observe `note-used` and an unchanged fee balance for the second account. Run `npm test` before and after. It is already the local proof. Do not weaken it to make the contract pass.

Phone tests stay manual. Airplane mode is the proof.

### Scope map

**Contract.** Contains: `deposit`, `settle` of one cheque, rejection of a second cheque for the same note id, fee credit to the first settler, explorer URLs written into the README. Excludes: `rotate`, `withdraw`, `fraud_proof`, phones, screens. Tracer: one command prints two transaction hashes. The second is a rejection.

**Glue.** Contains: private bitchat text equal to a frame `issueCheque` already produced, submit on reconnect, `SOZU2:` gossip, the other phone moving pending to heard to settled. Excludes: a new Bluetooth stack, a new message type, UI beyond those three words. Tracer: one clip of that sequence, then the explorer rejection.

**Screens.** Contains: mesh ticks, pay amount for the two parties, result words, the fee line for the first settler, "note already used" in flag color `#C4552A`. Excludes: GPS, a map, amounts on the mesh screen, SPP, the ESP32. Tracer: a test feeds the four RSSI buckets and the screen draws the matching ticks, and a ping with an amount is rejected.

### Constraints and rejected alternatives

- QR as a payment path was rejected. The mesh stops if `sozu-text-1` has not arrived.
- A website cannot hear Bluetooth. The watch page shows vault events after an upload.
- Confidential tokens and a shielded pool start only after the reject video, and only before Mon 07:00 UTC. They are not this PRD.
- `MessageSpecialParser` tokenizes geohashes and URLs. It is not the cheque parser.
- ADR 0002's prose sizes (330 and 181) are the framed texts. The code's wire sizes are 243 and 131. Agents follow the code.
- The reward is `DEMO_FEE` on the first successful settle of a note. A points program was rejected.

### Skill order

Do not re-grill. `to-prd` and `to-robo-prd` are this page. Next is `to-tickets` only if a human wants tickets before code. Otherwise implement scope Contract with `tdd`, then `code-review`. One scope at a time. Screens do not start before the explorer links.
