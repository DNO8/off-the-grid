# Off the Grid — Android downloads

A minimal, responsive Android download page branded **Off the Grid**, linking to the latest published **Sozu Offline** APK. React Bits **Dither Veil** powers the download card and **Ghost Fibers** powers the background, with a dark palette, orange accents, and DM Sans typography.

## Run locally

Requires Node.js 22.12+ (24 LTS recommended).

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. No API keys, accounts, or backend are required. Artwork, components, and fonts are served locally; downloading the APK requires access to GitHub.

## Downloads

The download action points directly to:

<https://github.com/Sozu-Capital/sozu-offline/releases/latest/download/sozu-offline-pay.apk>

GitHub resolves this URL to the latest published release, so subsequent releases do not require a website rebuild. Release publishers must retain the asset name `sozu-offline-pay.apk`. A release without that asset, or unavailable GitHub access, will prevent the download; the page does not substitute an older Bitchat APK. No fixed version or file size is displayed because those values would become stale.

Verified on 2026-10-26: the latest release was [`sozu-apk-0.1.12`](https://github.com/Sozu-Capital/sozu-offline/releases/tag/sozu-apk-0.1.12), with a 77,101,462-byte APK and SHA256 `cc56c0df709d71ba372102f16b8a23670cad1cfd42cd2edddc9bbb4724363eeb`. These details identify that release only, not future downloads. Its release notes warn that uninstalling deletes the phone wallet and its link; follow the release's update instructions.

The link and labels live in `src/App.tsx`. Browser tests verify the latest-release URL, accessibility, and attachment-download behavior with a stubbed GitHub response; they do not download or authenticate the live APK. The previous Bitchat files remain under `public/downloads/` as legacy assets, but the page no longer links to them.

## Check and build

```sh
npm run format:check
npm run typecheck
npm test
npm run build
npm run preview
```

Browser tests use installed Microsoft Edge on Windows. On other platforms, install Chromium with `npx playwright install chromium`; `PLAYWRIGHT_CHANNEL` can select another installed supported browser. Tests store downloads/screenshots outside the project in a temporary `web-apk-tests-*` directory. Set `TEST_OUTPUT_DIR` to choose an external destination, or `TEST_BUILD=1` to test the production preview after building.

Deploying `dist/` is a separate step; nothing is published by these commands. Any binary redistribution must retain applicable licenses and provide the corresponding source under its license. See [third-party notices](THIRD_PARTY_NOTICES.md).

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

Before publishing, satisfy the source-distribution requirements for the legacy bundled Bitchat assets in the third-party notices. The active download is hosted by the Sozu Offline release repository; this website does not rebuild, re-sign, or independently verify its payment functionality.

References: [Vercel for GitHub](https://vercel.com/docs/git/vercel-for-github), [Git deployment restrictions](https://vercel.com/docs/git), [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite).

## Visual behavior

- Only the latest-APK download card is interactive; there is no navigation, signup, or additional CTA.
- Keyboard focus remains visible. The card works without WebGL, and reduced-motion preferences disable the GPU effects.
- Official TS/CSS React Bits components live in `src/components/react-bits/`; keep their license and avoid formatting generated component source.
- All artwork is local. The custom orbit SVG is the image input for Dither Veil, not a substitute for the actual component.
