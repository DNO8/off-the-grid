# Sozu Offline

Hack Meridian 2026.

Decision in review: [ADR 0001](docs/adr/0001-demo-scope-for-hack-meridian.md).

Spoken line: **Offline Stellar payments. A second spend of the same note fails on chain.**

Presenter deck: [docs/slides.md](docs/slides.md). The ESP32 board stays off the slides until Vini's 184-byte packet works.

## APK download website

The independent [download website](landing-sozu/README.md) lives in `landing-sozu/`. It distributes unmodified upstream Bitchat Android v2.0.3 binaries, not a Sozu mobile release. Preserve the [licenses, checksums, and corresponding-source references](landing-sozu/THIRD_PARTY_NOTICES.md).

Use Node.js 22.12.0 or newer:

```bash
npm --prefix landing-sozu ci
npm --prefix landing-sozu run dev
```

The website has its own package and lockfile; the root commands below are unchanged. See its README for typechecking, browser tests, and production builds. Serve the app from its own origin root, not a `/landing-sozu/` URL prefix. This import does not deploy the site.

## Sozu mesh APK

Sozu pay releases live on this repository: https://github.com/Sozu-Capital/sozu-offline/releases. Download `sozu-offline-pay.apk`. The Sozu changes are `android/sozu`, applied onto the pinned bitchat-android tree. They are not published from the bitchat-android fork. See [android/README.md](android/README.md).

## Test 01 — plain text

The first test is a private message, `sozu-text-1`, from the pinned bitchat forks. Plan: [docs/prd/test-01-plain-text.md](docs/prd/test-01-plain-text.md).

```bash
npm test
./scripts/sync-forks.sh
```

`npm test` checks the payload and the pins. The phone install is in the test PRD. iOS fork: https://github.com/Sozu-Capital/bitchat. Android fork (GPL-3.0): https://github.com/Sozu-Capital/bitchat-android.

## Testnet vault — ticket 3

The [Soroban vault](https://stellar.expert/explorer/testnet/contract/CDSCQSVWKTYR7EUJK5EQXIFI4L2C4LCPQOIUYP6PMG6KW4O2BZGCRLLV) uses Circle testnet USDC (`CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA`). The owner [deposited 0.2 USDC](https://stellar.expert/explorer/testnet/tx/23b7c752aa51ac1822c7b6204a0a61179b9b33aa39003a71323f07f25051db5e) before these two distinct, signed cheques with the same note id (`8ca3b1bdc7e642d2bb9e221c8b127e8d`):

| Attempt | Explorer | Contract result | USDC credited |
| --- | --- | --- | --- |
| First | [settled](https://stellar.expert/explorer/testnet/tx/b26a45961b7a435385d04c230058d80fa3b09c0a33a8b5eaf0d608342839fa9e) | `ok: true`; remaining collateral 0.09 USDC | Payee 0.1 USDC; first settler 0.01 USDC (`100_000` minor units) |
| Second | [rejected](https://stellar.expert/explorer/testnet/tx/3c8c0df9d75eb97c0e614538a1e3271c4a501aa2ecd114247ec36b5472cd37d5) | `ok: false`, `reason: note-used`, `fee: 0` | Second payee and settler 0 |

The second transaction has an on-chain `rejected` event and no USDC transfer. The explorer marks the transaction itself successful because the contract returns a rejection result instead of reverting. The checked settler balances are `100_000` and `0` minor units respectively.

`protocol/cheque-vector.json` is unchanged and remains the byte-layout test vector. Its literal expiry is in the past and its owner/payee bytes are test placeholders. The testnet cheques were freshly signed with that same 179-byte body and 64-byte low-S P-256 signature layout. Run `cargo test --manifest-path contracts/vault/Cargo.toml` for the frozen vector and same-note rejection tests; `scripts/make-testnet-cheques.mjs` creates live-layout cheques for funded testnet accounts.

## Witness — ticket 7

The [ESP32-S3 SuperMini sketch](firmware/witness/README.md) builds for 4 MB flash and no PSRAM with `python -m platformio run -d firmware/witness`. It advertises one BLE characteristic containing the committed [184-byte packet vector](firmware/witness/vector/checkpoint-184.json). The signed `SOZU2:` frame is 181 bytes; the final three zero bytes are transport padding. The vector uses a test-only vault and key, while referencing the note ID from the first testnet settlement. The board-to-phone packet test awaits the physical board.

The laptop Wi-Fi fallback keeps SHA-256 hashes of confirmed spent note IDs in a local state file. A synced cheque with the same note ID is flagged `note-used`. To upload a live 243-byte cheque wire from a JSON file, set `SOZU_TESTNET_SECRET` to a funded testnet settler key or use `--ephemeral-testnet yes` for a throwaway Friendbot-funded settler:

```bash
node scripts/witness-upload.mjs --wire-json path/to/cheques.json --wire-field secondWire --state .exponential/witness-state.json --ephemeral-testnet yes
```

The uploader submits `settle` to the deployed vault, waits for a finalized transaction, and records the note hash only after `ok: true` or on-chain `note-used`. [This Wi-Fi fallback upload](https://stellar.expert/explorer/testnet/tx/b4e5bac74a62d3e4cbf9c2e03492b15450206034f22b11155f530a1b9c6ff316) returned `note-used` and `fee: 0` for the already spent demo note. A repeat with the same local state is flagged before another submission. The state file and testnet secret stay outside Git.

## Physical witness concept

Joaco's [original blueprint](docs/media/witness/joaco-blueprint-original.png) and the [35-second concept video](docs/media/witness/sozu-witness-blueprint-concept.mp4) preview the hardware we want to build. The video animates the original blueprint without changing its annotations and closes with the spoken line above. These are proposed physical-device visuals; the ESP32-to-phone radio packet test remains pending.
