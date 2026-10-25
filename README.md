# Sozu Offline

Hack Meridian 2026.

Decision in review: [ADR 0001](docs/adr/0001-demo-scope-for-hack-meridian.md).

Spoken line: **Offline Stellar payments. A second spend of the same note fails on chain.**

## Test 01 — plain text

The first test is a private message, `sozu-text-1`, from the pinned bitchat forks. Plan: [docs/prd/test-01-plain-text.md](docs/prd/test-01-plain-text.md).

```bash
npm test
./scripts/sync-forks.sh
```

`npm test` checks the payload and the pins. The phone install is in the test PRD. iOS fork: https://github.com/Sozu-Capital/bitchat. Android fork (GPL-3.0): https://github.com/Sozu-Capital/bitchat-android.
