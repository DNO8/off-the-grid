# Import the native Android prototype
Objective: publish the existing native mobile work as a draft PR, not as a working payment APK or release.
Branch: `feat/mobile-sozu-import`, base `dev` at `0133f3ac64e375c45e198ae1cd80a0936c2638b7`. Delivery: `exception-ok`, one draft PR. Runners: root Node tests and offline Android checks when an existing toolchain is available.

## Specs

### S1 — Publish the existing mobile work

User request: "sube el pr de la app mobile".

Acceptance: preserve the current native Kotlin/Compose fork and its existing identity/branding changes as an isolated `mobile-sozu/` module. Do not implement missing payments, redesign transport, or claim that debug artifacts establish a usable Sozu payment app. Document every failed, skipped, or unavailable check in the draft PR.

### S2 — Use the selected monorepo and development base

User direction: "tiene que ir aca https://github.com/Sozu-Capital/sozu-offline en la rama dev".

Acceptance: publish only to `Sozu-Capital/sozu-offline`, with PR base `dev`, using the already authorized DNO8 GitHub CLI session and repository-local noreply author. Preserve both original clones and the unrelated dirty website worktree. Do not configure or publish a separate mobile remote.

### S3 — Import the complete module and update ownership

Accepted option: "Importar el módulo completo".

Accepted scope: "Agregar fuente y bibliotecas necesarias en mobile-sozu/, conservando GPL-3.0 y los avisos originales. Actualizar la decisión de arquitectura y el README. Excluir .git, cachés, datos locales y APK generados. PR hacia dev, con pagos y validaciones pendientes documentados; sin merge ni release."

This choice followed the explicit forecast of 729 source files, approximately 33 MB, a change to ADR 0003's external-Android ownership rule, and one cohesive draft PR with a size exception. Preserve required upstream native libraries and executable script modes, not generated APKs or build outputs. Add a superseding ADR rather than silently rewriting the historical decision. Leave root packages, protocol, frozen vectors, fork pins, firmware, and website behavior unchanged.

## Tasks

- [x] T1 — S1–S3 import/documentation scope: canonical source, provenance, architecture and contributor docs preserved and independently verified; unavailable Android proof and the environmental root failure disclosed. Route: delegated direct, named reason: long-session context backstop. One bounded writer owned source, tests, and docs together; parent owns Git and this logbook. Risk: items 2 (Android identity/permission/provider isolation) and 5 (native dependencies/build environment). Commit: pending creation of the verified work unit; publication remains T2.
- [ ] T2 — S1–S3: assess the immutable work unit and publish one draft PR into `dev`, without merge, release, APK upload, or project-management mutations. Route: inline parent coordination; long checks use bounded per-action workers. Commit/PR evidence: pending.

## Log

- L1 — 2026-10-26, original request verbatim: "sube el pr de la app mobile".
- L2 — User destination verbatim: "tiene que ir aca https://github.com/Sozu-Capital/sozu-offline en la rama dev".
- L3 — User selected "Importar el módulo completo" with the scope quoted in S3, explicitly approving the monorepo ownership change and cohesive size exception.
- L4 — Fresh `dev` is `0133f3a`; created an isolated worktree and `feat/mobile-sozu-import` from that boundary. Existing web changes and the original native checkout remain outside this candidate.
- L5 — Source baseline is `137ce6d01bba0b92f03ea49a9d6c9d3411a79706`, with the approved pre-existing native identity changes. Inventory: 729 selected source files, 33,111,039 bytes, including upstream native `.so` libraries. Exclude original Git metadata, task notes, caches, reports, local configuration, and generated APKs. Capture Git-canonical source content and modes; do not turn Windows checkout line endings into broken Unix wrapper scripts.
- L6 — Test-first exception: this is an import of an already implemented prototype, not implementation of a new payment rule. Preserve imported regression tests and compare source/candidate content. No RED/GREEN evidence is invented. Existing evidence is limited: one identity test report passed; a historical full run recorded 694 app tests with 28 baseline failures and 3 skips. Existing lint permission findings and absent physical-device proof remain explicit limitations.
- L7 — Required checks: source snapshot/mode integrity; APK/cache/secret exclusion; module app/permission/provider configuration; root baseline regression checks where runnable; documentation/whitespace readback. Attempt offline focused Android identity/build commands only with an existing local JDK/SDK; no toolchain downloads, browser/device access, ADB, emulator, signing-key reads, or source-checkout mutation. Unavailable Android proof stays unavailable and does not become a release claim.
- L8 — The module remains an inherited chat/mesh prototype: Sozu P-256 signing, owner binding, payment states, settlement/checkpoints, and payment/result screens are not complete. Existing `/pay` is Cashu, not Stellar. Private-text encoding's 255-byte cap and the 330-byte canonical `SOZU1:` frame remain an integration issue; do not alter the frozen wire format in this import.
- L9 — Parent baseline for independent verification: `0133f3ac64e375c45e198ae1cd80a0936c2638b7`. Verify the whole feature document in fresh external scratch, distinguishing unchanged upstream issues and explicitly accepted WIP limitations from import-caused defects. Native review is candidate-scoped and follows only provider-owned transitions; no earlier website lineage or receipt is reused.
- L10 — Captured canonical source tree `b225a2c25dadb94c108afecb22fa5e4551b51df1` with an external temporary index: 729 files, 22 executable scripts, no symlinks. The original mobile index and HEAD were checked unchanged; its working files were not edited. The archive and manifest stay outside the workspace and are passed privately to the bounded writer. Git-canonical line endings avoid importing Windows checkout artifacts.
- L11 — The bounded writer returned `partial`: all 729 working-tree blob hashes match the archive, plus `SOZU.md` and scoped integration documentation (161 authored lines before parent normalization). Root offline installation failed on uncached `smol-toml` 1.9.1, with an `EPERM` cleanup warning. `npm test` observed 20 passing tests and one failed file, `test/witness-upload.test.mjs`, because `@stellar/stellar-sdk` was unavailable; the chained syntax check did not run. Focused Android identity tests and assembly were not run because the existing local toolchain prerequisites were unavailable. These limitations are accepted draft-review disclosures, not successful functional proof.
- L12 — Parent restored all 22 manifest executable modes. Initial staged comparison exposed automatic CRLF cleaning of two otherwise unchanged upstream blobs (`gradlew.bat` and `app/src/main/assets/nostr_relays.csv`). Added exact-path `-text` attributes and reapplied them with scoped `git add --renormalize`; both staged hashes now equal the captured manifest. Corrected PowerShell examples to use `.\gradlew.bat`. Parent hash spot checks for `gradlew` and `LICENSE.md` passed, and staged whitespace checking passed. Canonical archive size is 32,952,602 bytes; the earlier 33,111,039-byte inventory measured Windows checkout bytes.
- L13 — Delegated-change assessment requested escalation item 2, also naming item 5. It returned high/unassessable because pre-existing untracked runtime metadata and this task document were not declared. No risk was lowered and no review was started; independent verification is still required. The committed work-unit assessment will use the exact branch baseline and committed-only selectors, excluding unrelated runtime metadata.
- L14 — Independent verification of candidate tree `1fdacc0b54d3613733e61cb732d50c5be900556f` found no import-caused blocker: all 729 source hashes/modes and 79 protected existing files match; no excluded paths; authored links resolve; application/provider/signature-permission source isolation verified. The inherited identity test covers ID and shutdown constants, not labels/legacy URI; independent source probes covered those properties. Wear retains its upstream identity and no phone/Wear device coexistence is claimed.
- L15 — Canonical external baseline/candidate snapshots both produced identical `npm test` failure semantics: exit 1, 20 passes, one failed file, missing Stellar SDK. Both passed `bash -n scripts/sync-forks.sh`; all snapshot hashes remained unchanged. Initial CRLF-converted archive runs were discarded, then materialized again with `git -c core.autocrlf=false archive`; npm tests therefore ran twice per snapshot overall. Android commands remained not run. The suggested history-dependent regression artifact was not added: this import introduces no new product rule, committed tests must not depend on a fixed Git baseline, and the executed import probes remain external evidence.
- L16 — Rollback boundary: remove `mobile-sozu/` and reverse the scoped README/ADR/attribute integration without changing protocol, pins, firmware or website. Source import and release proof are separate; T1 closes the authorized draft-source scope, while native assessment/consent and actual publication remain T2. Functional release validation is not waived or represented as passing.
