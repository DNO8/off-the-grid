# ADR 0002 — Recovery and the mesh ledger

- Status: Accepted
- Date: 2026-10-25
- Author: Joaquín
- Amends: ADR 0001 kill switch "Sun 18:00", and PRD defaults Q4 and Q5. It does not change the spoken line.
- ADR 0003 adds the room witness. The mesh on this page still does not replace Stellar.

## Decision

The classic account that deposits is the owner. The P-256 key in the secure element only signs cheques. Recovery is the owner key.

The mesh carries checkpoints of notes Stellar has already settled. It does not replace Stellar. The first phone that uploads a note earns that note's fee. A phone that never connects can still learn the note id from a later meeting.

## Recovery

`deposit` stores `owner` and `device_key`. Cheque verification uses the device key. `withdraw_after_expiry` and `rotate_device_key` require the owner. Soroban auth is that check. The sim in `protocol/vault.mjs` compares the caller bytes.

Rotation adds the new device key and keeps the old one valid until the deposit lock. An in-flight cheque still settles. A stolen phone can still sign until that lock. There is no remote wipe. After the lock, the owner withdraws whatever collateral was not spent. A lost phone does not lose that withdrawal. A lost owner seed does.

The demo does not build a recovery screen or a rotate call. The fields have to be in `deposit` now, or the loss of a phone is the loss of the money.

Passkey smart accounts stay out of this window.

## What the mesh is

Two strings, both ordinary bitchat texts:

- `SOZU1:` is the private cheque. Payer and merchant can read the amount. A phone that only relays it cannot. That is still Q5.
- `SOZU2:` is one settled note: vault prefix, Stellar ledger sequence, fee, note id, settler device key, low-S signature. No amount. 181 bytes, three under the 184-byte fragment cap. Do not add a field. A batch of three notes is three of these, which is the demo batch.

`SOZU1:` is 330 bytes, two fragments. Test 01 stays the single fragment `sozu-text-1`. The cheque is not that test.

Local status is `pending` (cheque, no checkpoint), `heard` (checkpoint, this phone has not seen Stellar), `conflict` (both), or `settled` (this phone saw the vault). The screen says pending, then heard, then settled. It does not say a double-spend was impossible.

A checkpoint is a claim. The vault is the fact. A signed lie can make a far phone show heard. It cannot collect the fee, and the phone that connects still uploads a real cheque. Funds move only in `settleCheque`.

The first upload of a note earns its fee, 0.01 USDC in the demo. A later upload of the same note gets nothing. One bad cheque in a batch does not roll back a good one. Collateral that cannot cover a second note rejects that note and leaves the first one spent.

## Speed and distance

A hop is one meeting with both apps in the foreground. In a room, overlapping radios, that is seconds. A third phone is that hop, and it is a bonus.

Across a city the checkpoint moves when two phones that already carry the app meet. The delay is the time until that meeting. Kilometers in a few minutes would need a chain of ranges that overlap at the same moment. Day-to-day Bluetooth does not provide that, and this demo does not show it.

The video does not say the mesh replaced the internet, and it does not say a checkpoint crossed a city in minutes.

## Code this hour

`protocol/cheque.mjs`, `protocol/checkpoint.mjs`, `protocol/vault.mjs`, `protocol/mesh.mjs`. The frozen vector is `protocol/cheque-vector.json`. A test-only key, no funds. `npm test` covers it. iOS, Android, and the contract have not accepted those bytes yet. They copy this vector. They do not invent a second layout.

## Kill switch

ADR 0001 set Sun 18:00 as the testnet gate. That clock assumed the vault was already underway. This hour is the protocol, and the next ninety minutes are the phone test. The gate moves to 22:30 UTC. The rule does not move: until a second spend has failed on testnet, the video says pending and does not say a double-spend was proved.

Mon 03:00 and Mon 07:00 are unchanged.
