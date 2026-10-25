# ADR 0003 — Witness, APK, and how an account opens

- Status: Accepted
- Date: 2026-10-25
- Author: Joaquín
- Amends: ADR 0001 demo open and the "we do not demo NFC" line. Amends ADR 0002 by adding the room witness. Does not change the spoken line, the cheque bytes, or the `SOZU2:` layout.

## Spoken line

**Offline Stellar payments. A second spend of the same note fails on chain.**

That sentence stays. The screen says pending, then heard, then settled. It does not say a double-spend was impossible. Collateral still covers one losing merchant. A third copy of the same note can still leave someone unpaid.

## What flags a second spend

Three copies of the same fact. They do not replace each other.

1. The vault. The note id spends once. A later cheque for that id is rejected. The first upload keeps the 0.01 USDC fee. This is the fact on the video.
2. The witness Merkle tree. The backup node stores the hash of each note it has already settled. A second cheque whose note hash is already a leaf is flagged on any phone that has synced with that node. A phone that has not met the witness still shows pending.
3. SPP, the shielded pool. Inside the pool a spent note is a nullifier in the pool's Merkle tree. A second spend is that same nullifier. The chain shows the root and the nullifier. It does not show payer and merchant. SPP is that flag. This window does not ship a Groth16 proof, and it does not add a field to the cheque or to `SOZU2:`.

Editing a sequence number on a cheque breaks the device-key signature. The vault rejects that cheque as a bad signature. The race that remains is two valid cheques for one note id.

## Backup node

One node stays on Wi-Fi and Bluetooth. It hears cheques the mesh is carrying, uploads them, and gossips `SOZU2:`. That is how the mesh copy and the chain copy of a spent note stay on the same hash while the node is in the room.

The hardware is an ESP32-S3 SuperMini, Mauser part 095-8560, €9.90: https://mauser.pt/095-8560/esp32-s3-supermini-placa-de-desenvolvimento-com-esp32. Wi-Fi 2.4 GHz and Bluetooth 5 LE. 4 MB flash, no PSRAM, ceramic antenna, headers unsoldered. It is not an ESP32-WROOM.

The board does not speak bitchat. A phone in range relays. The ceramic antenna is a room. Until the board exchanges one 184-byte Bluetooth packet with a phone, a phone on Wi-Fi fills the same role, and the video does not mention the board.

## What the room sees

1. The account opens. Either a tap on an NFC card opens the Sozu account, or Sozu Faucet pays testnet Circle USDC to that account (https://faucet.sozu.capital). The tap is onboarding. The card is not the cheque and it does not move USDC. We do not claim the Payala NFC payment. The tap is done with the reader in the foreground, before airplane mode.
2. The logged-in account deposits. Owner and device key are stored as in ADR 0002.
3. The phone goes offline and pays with a signed cheque on the new APK.
4. The witness uploads. A second spend of that note fails on chain. A phone that has the witness tree flags the same hash.

## The APK

The new Android app is the Sozu Capital fork of bitchat-android. GPL-3.0 stays in that repo. sozu-offline does not vendor the tree. The Bluetooth stack stays bitchat. `SOZU1:` and `SOZU2:` stay ordinary texts.

Sozu wallet needs an update so a Sozu account can log in on this APK and pay. The logged-in account is the owner. The device key still signs the cheque. The owner key still rotates and withdraws. Seeds are not written into this page.

iOS, passkey smart accounts, and a WebView of the Sozu PWA stay out of this window.

## Kill switch

| When | If this is true | We do this |
| --- | --- | --- |
| Reject video | The board has not passed one 184-byte packet with a phone | The witness is the phone on Wi-Fi. Do not mention the board. |
| Account open | The NFC tap fails | Claim from the faucet. Do not pay by NFC. |
| APK | Sozu login is not on the build | Sign with the device key the vault already stores. Do not hold the reject video for login. |
| Mon 07:00 | No video of the rejected second spend | SPP does not start. The title stays the spoken line. |

ADR 0001's 22:30 UTC testnet gate and Mon 03:00 `fraud_proof` gate are unchanged.
