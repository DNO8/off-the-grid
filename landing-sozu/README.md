# Off the Grid — Android downloads

A minimal, responsive Android download page branded **Off the Grid**, with exactly two download actions. React Bits **Dither Veil** powers the cards and **Ghost Fibers** powers the background, with a dark palette, orange accents, and DM Sans typography. The website branding does not change the downloaded applications: both APKs remain unmodified Bitchat releases, not an Off the Grid payment app.

## Run locally

Requires Node.js 22.12+ (24 LTS recommended).

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. No API keys, accounts, backend, or external runtime requests are required. APKs, artwork, components, and fonts are served locally.

## Downloads

The two unmodified APKs were copied from `../artifacts/bitchat-v2.0.3/`. The originals were not changed. Both are the official upstream **Bitchat Android v2.0.3** release for Android 8.0+.

| Build     | Local file                                       | Size             | Intended use                        |
| --------- | ------------------------------------------------ | ---------------- | ----------------------------------- |
| ARM64     | `public/downloads/bitchat-android-arm64.apk`     | 19,977,772 bytes | Most modern Android phones          |
| Universal | `public/downloads/bitchat-android-universal.apk` | 51,915,500 bytes | Architecture compatibility fallback |

The browser tests verify the exact size and SHA256 of each downloaded file. Version, labels, and paths are in `src/App.tsx`. When changing releases, replace both APKs and update their labels, sizes, and checksum expectations in `tests/downloads.spec.ts`.

## Check and build

```sh
npm run format:check
npm run typecheck
npm test
npm run build
npm run preview
```

Browser tests use installed Microsoft Edge on Windows. On other platforms, install Chromium with `npx playwright install chromium`; `PLAYWRIGHT_CHANNEL` can select another installed supported browser. Tests store downloads/screenshots outside the project in a temporary `web-apk-tests-*` directory. Set `TEST_OUTPUT_DIR` to choose an external destination, or `TEST_BUILD=1` to test the production preview after building.

Deploying `dist/` is a separate step; nothing is published by these commands. Any future redistribution must retain the applicable licenses and make the corresponding Bitchat source available under its license. See [third-party notices](THIRD_PARTY_NOTICES.md).

## Deploy to Vercel from GitHub

You can import a repository owned by your personal GitHub account into Vercel after granting the Vercel GitHub App access to it. Use these project settings:

| Setting          | Value                                         |
| ---------------- | --------------------------------------------- |
| Framework preset | Vite                                          |
| Root Directory   | `landing-sozu` for this repository            |
| Install command  | `npm ci`                                      |
| Build command    | `npm run build`                               |
| Output Directory | `dist`                                        |
| Node.js          | 24.x                                          |
| Environment      | No application environment variables required |

If you instead copy only this directory into a new personal repository, use that repository's root as the Root Directory. Include `public/downloads/`, all license notices, and the lockfile; do not upload `node_modules/` or `dist/`. Run the checks above before publishing.

A personal Vercel Hobby project cannot import a **private organization-owned repository**. Use an eligible personal repository or a suitable paid team plan; organization imports also require the appropriate organization membership and repository access. These settings do not verify your account permissions or publish anything.

Before publishing, satisfy the source-distribution requirements in the third-party notices. The bundled APKs are Bitchat downloads, not evidence that the payment functionality described by the landing is present in those binaries.

References: [Vercel for GitHub](https://vercel.com/docs/git/vercel-for-github), [Git deployment restrictions](https://vercel.com/docs/git), [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite).

## Visual behavior

- Only the two download cards are interactive; there is no navigation, signup, or additional CTA.
- Keyboard focus remains visible. Both cards work without WebGL, and reduced-motion preferences disable the GPU effects.
- Official TS/CSS React Bits components live in `src/components/react-bits/`; keep their license and avoid formatting generated component source.
- All artwork is local. The custom orbit SVG is the image input for Dither Veil, not a substitute for the actual component.
