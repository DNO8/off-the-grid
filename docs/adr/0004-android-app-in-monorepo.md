# ADR 0004 — Own the Android prototype in this monorepo

- Status: Accepted
- Date: 2026-10-26
- Supersedes: only ADR 0003's Android source-ownership clause in "The APK".

## Decision

Own the complete native Kotlin/Compose fork in `mobile-sozu/`, an independent
Gradle build root. This is a **WIP chat/mesh prototype, not a functional Sozu
payment release**. Import its source, regression tests, required native libraries,
GPL-3.0 license and original notices together. Exclude Git metadata, local
configuration, caches, signing keys, reports and generated APKs.

ADR 0003's historical statement that `sozu-offline` does not vendor the Android
tree no longer governs source ownership. Its other decisions are unchanged,
including the intended Bluetooth transport, ordinary-text `SOZU1:`/`SOZU2:`
interface, account/owner model, witness scope and demo gates. This import does
not establish that those planned payment behaviors are implemented.

## Provenance and boundaries

The imported fork is based on Android source
`137ce6d01bba0b92f03ea49a9d6c9d3411a79706`, with the existing Sozu identity
changes. The captured canonical source tree is
`b225a2c25dadb94c108afecb22fa5e4551b51df1` (729 files).

That baseline differs from the external Android Test 01 pin beginning `95c0852`.
They serve different purposes: this module preserves the current prototype;
`forks.json`, the external fork repositories and Test 01 instructions preserve
the pinned plain-text experiment. Neither baseline is silently repinned or
declared compatible by this decision. Protocol source and frozen vectors remain
unchanged.

## Consequences

- Build and test Android from `mobile-sozu/`; no npm workspace, root package
  change or root CI integration is introduced. Nested upstream workflows do not
  execute as root GitHub Actions workflows.
- Keep the imported README and fork docs as historical source material. Use
  [SOZU.md](../../mobile-sozu/SOZU.md) for current monorepo instructions and
  verification limits; old local-repository claims are not current ownership.
- Preserve [the module license](../../mobile-sozu/LICENSE.md) and bundled
  notices, including native-library notices. Importing GPL-covered source does
  not by itself relicense the rest of this repository; distribution and future
  integration require appropriate license review.
- Existing `/pay` is Cashu, not Stellar. Payment signing, owner binding,
  settlement/checkpoints and payment screens remain incomplete. No APK upload,
  release, merge or separate mobile remote is part of this import.

The complete inherited snapshot is one cohesive, explicitly approved size
exception for a draft PR into `dev`. Preserve formatting and executable modes
rather than mass-formatting or splitting source from its tests and notices.
