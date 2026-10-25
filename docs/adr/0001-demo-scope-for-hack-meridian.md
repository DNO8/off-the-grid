# ADR 0001 — Sozu Offline at Hack Meridian

- Status: In review
- Date: 2026-10-25
- Author: Joaquín
- Need a reply from: the Android pair, and JB
- Window: HackMeridian 2026, through Mon 2026-10-26 12:00 Lisbon. Prize pool on record: 30,000 USD. Event: https://meridian.stellar.org/hackmeridian
- This page is the decision. The PRD comes after the team has answered the questions at the bottom.

## What we are shipping

**Offline Stellar payments. A second spend of the same note fails on chain.**

Two phones in airplane mode, Bluetooth on, pass a signed cheque. The first phone that gets internet settles it on testnet. A second cheque for the same note is rejected on chain, and that rejection is on video.

The mesh is part of the build. There is no QR fallback. If the mesh does not work, this hackathon build stops.

## Build, in order

About 20 hours from the afternoon of Sun 2026-10-25.

1. Unmodified bitchat. One **private** message from the iPhone to the Android phone, airplane mode, Bluetooth on. A third phone relays only if those two already talk.
2. Fork bitchat. On receive, a message prefixed `SOZU1:` is parsed as a cheque. The chat UI and the Bluetooth code stay as they are until that message has arrived once. We do not write a Bluetooth stack.
3. Soroban vault on testnet, faucet USDC, classic account. `deposit`, then `settle_batch`. A laptop may submit the cheque bytes the phone received. Then a second cheque for the same note fails.
4. After step 3 is on video: payer and merchant screens, Secure Enclave / Android Keystore, and the phone submitting its own batch.

What another wallet can implement: the cheque bytes, a low-S P-256 signature over a single SHA-256, and the vault methods `deposit`, `settle_batch`, `fraud_proof`, `withdraw_after_expiry`. Collateral equals the sum of the note caps. That covers one losing merchant. A third cheque on the same note can still leave someone unpaid. We say that on stage.

## Why this shape

- PayPulse already pitched "offline-first Bluetooth payments on Stellar" as a video mockup (DoraHacks buidl 36325, https://dorahacks.io/buidl/36325, https://github.com/ombaviskar18/Paypulse). The difference we can show is the vault and the rejected second spend. Scout on 2026-10-25 found no directory project for this idea (`matchMode: weak`) and no verified contract on record.
- Payala already describes no-internet payments with NFC smart cards and patent US10885519B1 (Lumenloop slug `payala`, fetched 2026-10-25). We do not claim that invention, and we do not demo NFC. Apple turns background tag reading off in Airplane Mode: https://developer.apple.com/documentation/corenfc/adding-support-for-background-tag-reading
- bitchat is the mesh. Hop-by-hop relay is the gossip. A separate torrent stack is out. A Scout search of 1,356 hackathon builds found no torrent payment protocol.
- Confidential tokens are a real Stellar feature and a crowded hackathon field (Starlit Pay, StellarHub, Zebra, SHIELD, Payfurt, Olio). SDF's taxonomy still shows sender and recipient: https://stellar.org/blog/developers/developer-preview-stellar-private-payments (2026-08-24). A proof consumes the current balance, so it is a bad fit for several pre-signed offline cheques. Docs: https://developers.stellar.org/docs/build/apps/privacy#confidential-tokens
- bitchat-android is GPL-3.0. The Android fork is published. iOS bitchat is public domain.

## Last step, if the video already exists

One OpenZeppelin confidential settlement, before Mon 07:00 Lisbon, and only after the rejected-second-spend video exists. One transfer from the vault into an already-registered confidential account. Amount hidden. Sender and recipient public. Not a pre-signed offline cheque.

The title says "confidential" only after that transaction is on the explorer and in the backup video. Until then the title is the spoken line above.

Also out of these 20 hours: mock USDT0, a new bitchat message type, replacing the chat UI before step 2 works, a WebView of the Sozu PWA, passkey smart accounts. Mainnet USDT0 stays a slide (`USDT0:GATISXX6BZ6NC7IKQBY37CJD4SOZL3CYZJWXEDG6JVIY4WBS6KXJHN6Q`).

## Kill switch

| When (Lisbon) | If this is true | We do this |
| --- | --- | --- |
| 90 minutes after the BLE test starts | Unmodified private message has not arrived, iPhone to Android, airplane mode, Bluetooth on | Stop. Do not start a torrent client, a proof, or a UI rewrite. |
| Third phone silent, two phones work | Private message works between the pair | Ship two phones. Relay is a bonus. |
| Sun 18:00 | Test vector is not accepted on testnet | Show the mesh message. Say pending. Do not say a double-spend was proved. |
| Mon 03:00 | `fraud_proof` is not on testnet | The demo is "second settle reverts." Do not say a slash ran. |
| Mon 07:00 | No video of the rejected second spend | Confidential tokens do not start. The title stays public. |

## Questions for the team

Reply on this page. Default in the last column is what we will do if you don't answer.

| # | Question | Default if silent |
| --- | --- | --- |
| 1 | Mesh or stop: do you accept that a failed unmodified private message ends this build, with no QR fallback? | Yes. Stop. |
| 2 | Are two phones enough when the third does not relay? | Yes. |
| 3 | Public title until a confidential explorer link exists. Do you accept that? | Yes. |
| 4 | Collateral equals the sum of the note caps, and we say on stage that a third merchant can still lose money. | Yes. |
| 5 | A laptop may submit the first batch. The phone submits only after that works. | Yes. |
| 6 | Publish the Android fork under GPL-3.0. | Yes. |
| 7 | Who runs the unmodified bitchat test in the next 90 minutes, and who starts the vault? | Joaquín: iOS test. Android pair: Android test. Vault: whoever is not holding a phone. |
