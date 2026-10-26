# Sozu Android prototype — WIP

This module is the native Kotlin/Compose **chat/mesh fork, not a functional Sozu
payment release**. Inherited `/pay` uses Cashu, not Stellar. Importing the source
does not validate offline payments, physical mesh behavior or a release APK.

## Build independently

Use JDK 21, Android SDK 37, build-tools 37.0.0 and Gradle 9.6.1, as pinned in
`gradle/libs.versions.toml` and `gradle/wrapper/gradle-wrapper.properties`.
Run from this directory, not the monorepo root:

```powershell
.\gradlew.bat :app:testDebugUnitTest --tests "com.bitchat.android.contracts.SozuForkIdentityTest" --offline --no-daemon
.\gradlew.bat :app:assembleDebug --offline --no-daemon
```

On Unix use `./gradlew` instead. Offline checks require the wrapper distribution
and dependencies to be cached already; `--offline` alone does not prevent the
wrapper from downloading a missing distribution. Check prerequisites first.
Keep SDK configuration, caches, signing material and build outputs out of Git.
Do not install over an existing app or clear device data as part of this import.

Root npm commands remain independent and do not build Android. The preserved
`.github/workflows/` files describe upstream automation; nested workflows do not
enable monorepo root CI coverage.

## Provenance and license

| Item | Preserved source |
| --- | --- |
| Android baseline | `137ce6d01bba0b92f03ea49a9d6c9d3411a79706` |
| Canonical captured tree, including existing fork changes | `b225a2c25dadb94c108afecb22fa5e4551b51df1` |
| Snapshot | 729 files, including required upstream `.so` libraries |
| Ownership decision | [ADR 0004](../docs/adr/0004-android-app-in-monorepo.md) |
| License | [GPL-3.0](LICENSE.md), plus preserved bundled notices |

All snapshot files remain unchanged; this note is additional integration
documentation. Preserve the original [README](README.md), [fork notes](docs/sozu-fork.md)
and dependency notices as historical upstream/source material. Statements there
about a separate local repository, its Git metadata, local evidence or task paths
are not current monorepo instructions. The GPLv3 license file governs this module
despite the inherited README's public-domain wording; no automatic license change
to the rest of the monorepo is asserted.

The external Android Test 01 pin beginning `95c0852` is deliberately unchanged
and differs from this module's baseline. Keep [Test 01](../docs/prd/test-01-plain-text.md),
external fork pins, protocol and frozen vectors unchanged. This import does not
establish compatibility between those two Android revisions.

## Known limitations

- Sozu P-256 cheque signing, owner binding, payment states, settlement/checkpoints
  and payment/result screens are incomplete. Inherited Ed25519 messaging keys
  are not a P-256 payment signer.
- Private text has a 255-byte UTF-8 limit while the canonical `SOZU1:` frame is
  330 bytes. Compatible framing remains unresolved; do not alter frozen bytes
  or use public/Nostr fallback as evidence of offline Bluetooth delivery.
- The fork application ID is `com.bitchat.droid.sozu`, label `Sozu Offline`, with
  scoped provider and signature-protected shutdown permission. The Kotlin
  namespace stays `com.bitchat.android`; `bitchat://verify` remains supported.
  Source checks are not compiled-APK or real-device coexistence proof.
- See [the inherited payment gate and test caveats](docs/sozu-fork.md#payment-gate)
  and [Mesh Lab coverage limits](.agents/skills/mesh-lab/SKILL.md#interpret-results-precisely).
  No device, emulator, ADB or destructive Mesh Lab setup is authorized here.

## Verification evidence for this import

- Canonical blob comparison: all 729 imported files matched the captured
  manifest using `git hash-object --no-filters`. All 22 required executable-mode
  entries, including native libraries, were restored in the Git index on Windows.
  Module-scoped attributes preserve the two inherited CRLF blobs. No APK, cache,
  local configuration, keystore, report or runtime-metadata paths were found in
  the snapshot inventory.
- Focused identity test and debug assembly: **NOT RUN**. An existing JDK 21,
  SDK 37/build-tools 37.0.0 and cached Gradle 9.6.1 toolchain were not available
  in the inspected environment. No toolchain download was attempted.
- Root `npm ci --offline --no-audit --no-fund`: **FAILED**, missing cached
  `smol-toml` 1.9.1; npm also reported an `EPERM` cleanup warning.
- Root `npm test`: **FAILED**, 20 passed and one failed test file
  (`test/witness-upload.test.mjs`) because `@stellar/stellar-sdk` was unavailable.
  The chained shell syntax check did not run after that failure. Root package
  and lockfile bytes were unchanged.
- Independent canonical scratch verification found no import-caused blockers:
  all 729 source hashes/modes and 79 protected root files matched. Baseline and
  candidate `npm test` both had the same missing-SDK failure (20 passes, one
  failed file); their snapshot hashes remained unchanged. A separate
  `bash -n scripts/sync-forks.sh` passed in both snapshots. The inherited identity
  unit test does not cover labels or the legacy URI; source probes checked those
  properties without claiming compiled/device proof.
- Historical evidence only: one focused identity pass and a full app run of
  694 tests with 28 baseline failures and 3 skips were reported before import.
  Those are **not current executions**. Existing lint permission findings and
  absent physical-device evidence remain unresolved, not waived.

This evidence supports draft review only, not payment, release, APK-distribution
or merge approval. Record later failed, skipped or unavailable checks explicitly.
