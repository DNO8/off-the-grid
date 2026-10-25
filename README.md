# Sozu Offline

Hack Meridian 2026.

Decision in review: [ADR 0001](docs/adr/0001-demo-scope-for-hack-meridian.md).

Spoken line: **Offline Stellar payments. A second spend of the same note fails on chain.**

Presenter deck: [docs/slides.md](docs/slides.md). The ESP32 board stays off the slides until Vini's 184-byte packet works.

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
