# Sozu Offline downloads

The Sozu Offline landing page. The navbar uses the Sozu mark, and the page explains the offline cheque before the two Android downloads. React Bits **Dither Veil** powers the cards and **Ghost Fibers** powers the background. The APKs are the official upstream Bitchat Android builds, not a Sozu application binary.

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

## Visual behavior

- Only the two download cards are interactive; there is no navigation, signup, or additional CTA.
- Keyboard focus remains visible. Both cards work without WebGL, and reduced-motion preferences disable the GPU effects.
- Official TS/CSS React Bits components live in `src/components/react-bits/`; keep their license and avoid formatting generated component source.
- All artwork is local. The custom orbit SVG is the image input for Dither Veil, not a substitute for the actual component.
