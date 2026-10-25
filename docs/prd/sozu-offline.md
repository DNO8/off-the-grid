# PRD: Sozu Offline — Hack Meridian demo

Status: accepted v0.3, 2026-10-25. Plan A from ADR 0001. Supersedes the scope of `PRD_Sozu_Offline.md` (v0.1, same day) for the hackathon window. v0.1 remains the design notes, including the cheque layout.

Hackathon ends Mon 2026-10-26 12:00 Lisbon. Submit before that.

## Product line

Stellar payments that work with no signal: two phones in airplane mode exchange a signed cheque, and the first phone that gets internet settles it on testnet. A second cheque for the same note is rejected on chain.

The product other wallets build on is that cheque and the vault that accepts it. The Sozu screens are a reference implementation of the signer.

Spoken line, locked 2026-10-25 14:44 UTC: **Offline Stellar payments. A second spend of the same note fails on chain.** The title gains "confidential" only after one OpenZeppelin confidential settlement is on the testnet explorer and in the backup video. That settlement is the last step, before Mon 07:00, and only after the rejected-second-spend video exists. Until then the amounts on the explorer are public, and the title stays public too.

## User

A merchant and a payer who can stand next to each other and cannot reach the internet. The merchant hands over goods only for a cheque inside a risk cap they can see: the note cap, and the payer's locked collateral.

## Demo, 3 minutes

1. Both phones in airplane mode, Bluetooth on, apps in the foreground.
2. Payer pays the merchant. Merchant sees "Accepted, pending settlement".
3. One phone leaves airplane mode and submits the cheque. Screen shows the testnet transaction and an explorer link.
4. A second cheque for the same note fails with "note already used".
5. If `fraud_proof` is green: the losing cheque slashes the payer's remaining vault balance, and that transaction is on screen too. If it is not green, say the second settle reverted and stop.

## Must be true on video

- Cheque signed by a P-256 device key, low-S, hashed once, accepted by the contract.
- Note settles at most once. Amount at most the note cap. Fee at most the signed fee, paid to the settler.
- Wrong vault, wrong network, or expired cheque is rejected.
- One bad cheque in a batch does not roll back a good one.
- Funds leave the vault only to the merchant, the settler, the payer's refund, or the slashed party.
- UI copy says pending, then settled. It does not say the double-spend was impossible.

## What another wallet implements

Publish these in the repo README. A wallet is compatible when its signature verifies in the contract tests.

- Cheque fields and sizes from v0.1 section 7. Hash once with SHA-256. Signature is raw r and s, low-S.
- `deposit`, `settle_batch`, `fraud_proof`, `withdraw_after_expiry`.
- Invariants listed under "Must be true on video".
- One test vector: cheque bytes, digest, pubkey, signature.
- Stated limit: collateral covers one losing merchant. A third cheque on the same note can still leave someone unpaid.

## Build order

1. Frozen cheque bytes and one test vector that iOS, Android, and the contract all accept.
2. `deposit` and `settle_batch` on testnet, driven by a script, explorer link in the README.
3. `fraud_proof` and `withdraw_after_expiry` (demo expiry 1 hour, challenge 5 minutes).
4. Two phones exchange that cheque as a bitchat private message prefixed `SOZU1:`. Joaquín rejected a QR fallback (2026-10-25 14:16 UTC). If the unmodified private message does not arrive within 90 minutes, the mesh build stops. A third phone is a bonus, not a gate. Torrent and confidential proofs are out of this window. The gossip is bitchat's existing relay.
5. Payer and merchant screens around that path. Record three clean runs, then one backup video of the rejected second spend, then freeze.
6. Only after that video exists, and only before Mon 07:00: confidential settlement of one already-settled payment, or a labelled mock USDT0. Either one, not a research project. NFC stays a ten-minute side test, specified in ADR 0001, and is not this step.

## Roles in the demo

- Payer locks USDC, signs one note.
- Merchant verifies the signature locally and shows pending.
- Settler is whoever has the cheque and internet. Fee is the amount the payer signed, fixed at 0.01 USDC for the demo. First valid submission wins. A losing race pays nothing.

## Out of this demo

- OpenZeppelin confidential tokens and mock USDT0, until the backup video in build step 5 exists. After Mon 07:00 they stay out. LayerZero, trustlines, and clawback stay a slide either way.
- Sozu PWA inside a WebView. Passkey smart accounts.
- Background Bluetooth. A new bitchat message type, unless private messages are not relayed.
- Node marketplace, merchant risk-score product, fresh address per payment.
- Humanitarian bulk disbursement. That problem is already served online by the Stellar Disbursement Platform.

## Defaults taken from v0.1 open questions

| # | Demo default |
| --- | --- |
| Q1 | Test BLE in the first hour. Pin both bitchat commits in the README. |
| Q2 | Collateral equals the sum of note caps. |
| Q3 | Show the two-cheque case. Say a third merchant can still lose money. |
| Q4 | Device key stored at deposit. |
| Q5 | The submitting phone can read the cheque. Transit-only phones do not. Say this. |
| Q6 | Fee 0.01 USDC, first submission wins. |
| Q7 | Native screens for this flow only. |
| Q8 | Classic account. |
| Q9 | 1 hour expiry, 5 minute challenge. |
| Q11 | Confidential tokens or mock USDT0 start only after the rejected-second-spend video exists, and only before Mon 07:00. |
| Q12 | Measure batch CPU on testnet; demo batch size is 1 to 3. |
| Q13 | Normalize low-S in both apps. |
| Q15 | Publish the forks. GPL-3.0 applies to the Android tree. |
| Q16 | Repo, README, 3-minute video. Confirm the form on https://meridian.stellar.org/hackmeridian before 11:00. |

## What would make this false

The video shows a payment that never hits testnet, or the spoken line says double-spend is impossible, or the "offline" step used Wi-Fi.
