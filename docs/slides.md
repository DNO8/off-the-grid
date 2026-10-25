# Sozu Offline — Hack Meridian slides

Presenter notes for Joaquín. Read left to right. Do not add the ESP32 board until Vini's 184-byte packet works.

Spoken line, locked:

> Offline Stellar payments. A second spend of the same note fails on chain.

Sources: roster `cmvo5ecoh0015lf08g4itet4j`, Ready-to-code PRD `cmvo585s90009lf08v1wbhzgq`, ADR 0001 `cmvnwkw1n0001jq08arv0qj65`. Feature `cmvnw3wsl005ykw078w6baia9`.

---

## 1. Title

**Offline Stellar payments.**
**A second spend of the same note fails on chain.**

Sozu Offline · Hack Meridian 2026 · Stellar

Say the spoken line once. Do not swap it for “double-spend impossible.”

---

## 2. What you will see

Two phones. Airplane mode. Bluetooth on.

A merchant takes a signed cheque with no signal.

The first phone that reaches the internet settles that note on testnet.

A second cheque for the same note is rejected on chain.

That rejection is the demo.

No QR fallback. If the mesh does not carry a private text, this build stops.

---

## 3. Pending

The merchant holds a framed cheque.

Nobody has reached Stellar yet.

The cheque is **pending**.

`partyPayments` reports pending.
`meshLedger` omits that note.

The frame is `SOZU1:` plus the base64url wire.
Body 179 bytes. Signature 64 bytes, low-S. Digest is SHA-256 once over the body. Wire 243 bytes.

Follow the code sizes, not the older prose sizes 330 / 181.

---

## 4. Heard

A phone that never connected receives a checkpoint.

The checkpoint is **heard**.

`meshLedger` reports heard.
`partyPayments` omits the amount.

The frame is `SOZU2:`.
Signed body 67 bytes. Wire 131 bytes. Fits one 184-byte bitchat fragment.
No amount field. Vault prefix is the first 8 bytes of the vault id.

---

## 5. Settled

The first phone that reconnects submits the cheque.

The vault accepts it.

The note is **settled**.

Remaining collateral falls by amount plus fee.
`spent` records the note id.
The settler is credited the fee.

A later cheque for that note id returns **note-used**.
The second settler is credited nothing.

---

## 6. The fee

First successful settle of a note: **0.01 USDC**.

`DEMO_FEE` is `100_000` minor units.
USDC uses 7 decimals.

That fee goes to the first uploader, not to a points program.

The reject video does not wait for Sozu login on the APK.
If login is missing, the device key already stored at deposit signs the cheque.

---

## 7. A third cheque can still leave someone unpaid

Collateral equals the sum of the note caps.
That covers one losing merchant.

A third cheque on the same note can still leave someone unpaid.

We say that on stage.

We do not say a double-spend is impossible.
We show a second spend of the same note failing on chain.

---

## 8. What another wallet implements

- Cheque bytes: 179-byte body, 64-byte low-S P-256, SHA-256 once
- Frame: `SOZU1:` + base64url (243-byte wire)
- Checkpoint: `SOZU2:` (131-byte wire)
- Vault: `deposit`, then settle; a second note id fails `note-used`

Do not invent a second byte layout.
`protocol/` is the spec.

---

## 9. What this cut does not claim

- No QR payment path
- No ESP32 on these slides
- No Groth16 proof
- No confidential title until that tx is on the explorer
- No SPP in the morning video
- No new bitchat message type
- `MessageSpecialParser` is not the cheque parser

---

## 10. Close

**Offline Stellar payments.**
**A second spend of the same note fails on chain.**

Pending → heard → settled.
First uploader keeps 0.01 USDC.
Second spend of that note: `note-used`.
