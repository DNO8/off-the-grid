# Import the APK download website
Objective: import the existing download website and publish a pull request without merging or deploying it.
Branch: `feat/landing-sozu`, based on `dev` at `230b0040e59d40d8065b1e030a484e8e08aa54c8`. Delivery: `exception-ok`, one PR into `dev`. Runner: Node/npm, Playwright with local Edge.

## Specs

### S1 — Import and publish the existing website

User request: "ahora subamos la web".

Accepted option: "Subir código a GitHub".

Accepted scope: "Integrar ../web-apk como landing-sozu/, verificar, commitear y publicar una rama/PR hacia dev en Sozu-Capital/sozu-offline, usando la autenticación configurada de Git y GitHub CLI. Sin fusionar ni desplegar."

Acceptance: the existing website is a normal tracked `landing-sozu/` directory, not a submodule or npm workspace. Preserve its source bytes and original `../web-apk` safety copy. Include its tests, downloads, checksums, licenses, and source references. Keep existing root commands, protocol, contracts, frozen vectors, fork pins, Android research, and the old worktree unchanged. Verify copied bytes, formatting, types, development and built-preview browser tests, build, and existing root tests. These are import-safety checks, not additional product behavior.

### S2 — Use the development base

User instruction: "hay que usar la rama dev para todo los cambios".

Acceptance: work starts from the synchronized `dev` base, and the published PR targets `dev`. Do not change `main` or rewrite another worktree. Existing `docs/agents/git-flow.md` already records this base.

### S3 — Keep the cohesive import and install the publishing tool

Accepted option: "PR único e instalar gh".

Accepted scope: "Importar la web completa en landing-sozu/, conservando APK, licencias y referencias a su fuente. Preparar un único PR hacia dev con size:exception. Instalar el paquete oficial GitHub.cli mediante WinGet en este equipo y usar la autenticación configurada de Git/GitHub CLI. Sin fusionar ni desplegar."

Acceptance: one cohesive PR with the explicitly approved `size:exception`; no artificial code or test slicing. Install the official GitHub CLI through WinGet, retain native consent requirements, and use only the configured Git/GitHub authentication. Missing authentication or unavailable proof remains a blocker; do not invent credentials, merge, or deploy.

Additional accepted author option: "Usar DNO8 y noreply". Configure that verified account's public noreply identity only in this repository; do not change global Git author settings or expose a personal email address.

### S4 — Apply the team's Exponential PR guidance

User instructions: "el exponential explica como hacer el pr tambien" and "considera ambas cosas".

Acceptance: read the current Exponential PR instructions and apply them together with the approved GitHub identity and `dev` base. Use a ticket reference only when its scope actually matches this APK-download website import; do not confuse it with the separate wallet watch landing. Reading guidance does not authorize unrelated project-management changes or a merge.

Accepted ticket-linkage option: "PR sin ticket". Publish without ticket references or Exponential mutations, as the user's explicit exception to the documented ticket/branch/PR model.

## Tasks

- [ ] T1 — S1–S2: import, document, and verify the isolated landing. Route: inline; no writer trigger. Read-only mapping was delegated after the inline evidence budget. Own checks and independent Risk item 5 verification passed; native assessment/review remains pending. Commit: pending.
- [ ] T2 — S1, S3–S4: install the authorized CLI and publish the verified branch and one PR into `dev`. Route: inline coordination, with a per-action installation worker and read-only Exponential mapping. GitHub CLI, OAuth, approved repository-local author, and Exponential guidance are ready. User explicitly approved an unticketed PR; do not mutate Exponential. No merge or deployment. Commit/publication evidence: pending.

## Log

- L1 — 2026-10-25, original request verbatim: "ahora subamos la web".
- L2 — Prior user instruction verbatim: "hay que usar la rama dev para todo los cambios".
- L3 — User selected "Subir código a GitHub" with the exact scope quoted in S1.
- L4 — User selected "PR único e instalar gh" with the exact scope quoted in S3. This explicitly approves a cohesive size exception and the official WinGet CLI installation.
- L5 — Before source edits: `dev` and `origin/dev` matched at `230b004`; created `feat/landing-sozu` from that base. Only `.atl/` was untracked. Source `../web-apk` has no commits; the old `feat/web-monorepo` worktree remains untouched. RDD mode is on, decided by the global setting.
- L6 — Mapping found 29 deliverable files and approximately 1,043 authored text additions before integration documentation. Lockfile, vendored/generated material, and binary files are excluded from that forecast. Actual APK sizes are 19,977,772 and 51,915,500 bytes, totaling 71,893,272 bytes. One honest slicing pass found no independently usable smaller delivery; preserve the app rather than compressing or splitting it artificially. Approved strategy: `exception-ok`, one source-import work unit and one PR. Running committed authored count: 0.
- L7 — Planned edit surfaces: `landing-sozu/**`, root `README.md`, root `.gitignore`, root `.gitattributes`, and this logbook. Exclude nested Git, dependencies, dist, caches, environment/credential files, and runtime metadata. Root `*.apk` needs two exact allowlist exceptions. The app is served from its own origin root; importing a folder does not add subpath deployment support.
- L8 — Test-first exception: this is a byte-preserving import of an already implemented app, not a new behavior rule. Existing browser tests exercise the public UI and exact download bytes. Verify their behavior after relocation and preserve every imported file hash; do not invent RED/GREEN evidence. Dependency setup must use `npm ci --offline` with the existing local npm cache; do not access an unapproved package registry or install a browser. Use installed Edge. Test output and scratch copies stay outside the repository.
- L9 — Required checks: copied-file SHA256 equality; source APK expectations; `npm --prefix landing-sozu ci --offline`; `npm --prefix landing-sozu run format:check`; `npm --prefix landing-sozu run typecheck`; `npm --prefix landing-sozu test`; `npm --prefix landing-sozu run build`; `TEST_BUILD=1 npm --prefix landing-sozu test`; root `npm test` with Git Bash available; `git diff --check`. Formatting is check-only for this byte-preserving import. Any necessary source normalization must precede functional proof and native review freeze.
- L10 — Verification baseline: `230b0040e59d40d8065b1e030a484e8e08aa54c8`. The independent verifier reads all specs, uses a fresh external scratch copy, checks unchanged root behavior and protected-tree hashes, and inspects packaging/download integrity. Native assessment and any due consented review follow the exact provider lifecycle. Source bytes must not be fed to native reviewers through external scratch files.
- L11 — Imported the 29 allowlisted files with 29/29 SHA256 equality to the unchanged source. Both APKs match the checksums in the imported notices. Added only the two exact APK ignore exceptions and the root README entry; protected root paths have no diff. Generated dependencies and build output are ignored.
- L12 — Own checks observed: offline clean installation passed; format check passed without mutation; typecheck passed; Edge browser tests passed 7/7 in development and 7/7 against the production build; build passed; existing root tests passed 16/16 and the Git Bash syntax check passed; diff whitespace check passed. Parent reran typecheck successfully. Non-fatal imported vendor build-directive warnings and Windows LF/CRLF notices remain advisories.
- L13 — Official WinGet installation succeeded and GitHub CLI 2.103.2 was confirmed. The configured CLI authentication check exited 1 because no GitHub host is authenticated. No login, token extraction, push, PR, merge, or deployment has been attempted. Authentication remains a publication blocker, not permission to reuse another credential channel.
- L14 — Before committing, Git's default text conversion changed the staged DM Sans OFL notice despite an unchanged worktree. A raw-byte recheck caught this and stopped the commit. Added one file-specific `.gitattributes` rule to retain that upstream notice's original CRLF and trailing whitespace rather than rewriting the license. No imported file was edited; the exception applies to that notice only. Recheck the staged 29-file hashes and whitespace gate before committing.
- L15 — The file-specific attribute passed readback, all 29 staged blobs matched the source bytes, and the staged whitespace gate passed. The commit command then refused because no Git author name/email is configured; no commit was created. Keep the staged candidate intact for isolated verification and request an explicit author identity before committing. GitHub CLI authentication is also still unavailable.
- L16 — Independent Risk item 5 verification passed against immutable candidate tree `1a5850b695dd833ae323da2f2d27b0d827d39547`: 29/29 imported files matched source; all public assets survived the build byte-for-byte; clean offline install, format, typecheck, build, and both Edge suites passed; baseline and candidate root suites passed 16/16 with matching stable output; three packaging probes passed. No new local code blockers. Publication-related acceptance remains pending. Exact archives disable automatic CRLF conversion; initial converted-archive results were discarded.
- L17 — User requested OAuth, completed the GitHub browser authorization, then said "listo continua con el pr". GitHub CLI confirmed the active account and secure system-keyring storage. No challenge code or credential is retained in this document.
- L18 — User selected "Usar DNO8 y noreply". Verified the public GitHub account ID and configured only this repository's Git author as `DNO8` with `97417650+DNO8@users.noreply.github.com`. Global Git author settings were not changed.
- L19 — 2026-10-25, user instruction verbatim: "el exponential explica como hacer el pr tambien".
- L20 — 2026-10-25, user instruction verbatim: "considera ambas cosas". Added S4 and reopened the publication-guidance check without invalidating the completed application checks.
- L21 — Read-only Exponential mapping inspected the nine current HACK MERIDIAN tickets and relevant pages/comments. Current comments and repository policy confirm `dev`, overriding an older main-based PRD. No ticket matches this APK-download import. Parent spot-checked ticket #5 (`cmvo90m8s000vl208pza4i1fc`): it is the separate `/offline` vault watch page in sozu-wallet, not this website. Ticket #6 concerns documentation only. No team-wide PR title/template/reviewer/trailer rule was found; do not invent linkage or mutate unrelated tickets. Resolve whether to create a matching ticket or publish explicitly without one before publication.
- L22 — User selected "PR sin ticket", explicitly approving the unticketed exception. Do not create a ticket, add invented `Ships`/ticket trailers, or change Exponential status. Keep the approved single PR into `dev`, `size:exception`, DNO8/noreply author, and no-merge/no-deployment boundaries.
