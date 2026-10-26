# Third-party notices

## Sozu Offline download

The active download links to the APK hosted by [Sozu Offline releases](https://github.com/Sozu-Capital/sozu-offline/releases/latest). This website does not build, modify, re-sign, or bundle that APK. The permanent download URL expects the asset name `sozu-offline-pay.apk`.

The release inspected on 2026-10-26 was `sozu-apk-0.1.12`. Its release notes identify the Android fork source as [Sozu-Capital/bitchat-android](https://github.com/Sozu-Capital/bitchat-android), commit [`77356d7`](https://github.com/Sozu-Capital/bitchat-android/commit/77356d7). This source reference applies to that release only; consult each future release for its corresponding source and notices. Linking to a release does not constitute an independent security, signing-certificate, or payment audit.

## Legacy Bitchat Android assets

The retained files `public/downloads/bitchat-android-arm64.apk` and `public/downloads/bitchat-android-universal.apk` are unmodified upstream Bitchat Android **v2.0.3** binaries, copied from local release artifacts. They are not locally rebuilt or modified, and are no longer linked from the page. Off the Grid is the website brand, not the identity of these upstream applications.

- Upstream release: <https://github.com/permissionlesstech/bitchat-android/releases/tag/v2.0.3>
- Corresponding source: <https://github.com/permissionlesstech/bitchat-android/archive/refs/tags/v2.0.3.zip>
- Release source commit: `dfc67dad41691128bc6e7425bd69f2f409cb5bbf`
- SHA256, ARM64: `236450d653e357d775ad210a0f2a492f8ac5147be4ef9052b648dc4fc31fc1b0`
- SHA256, universal: `1ee83d51f73e0f08c0938873399fad3ca741bedd47e0421bf43c950b5436fe7c`

The Android repository's `LICENSE.md` contains GPLv3 despite its README's public-domain wording. A copy is served at `public/notices/bitchat-LICENSE.txt`. Preserve upstream dependency notices. Before publishing these binaries, provide the corresponding source in accordance with the applicable license; the upstream source URL above identifies the exact release, not the different local main checkout. Local checksum verification is not independent signing-certificate verification or a security audit.

## React Bits

[Dither Veil](https://reactbits.dev/animations/dither-veil) and [Ghost Fibers](https://reactbits.dev/backgrounds/ghost-fibers) were installed from the official React Bits registry using the TS/CSS variants. Copyright © 2026 David Haz.

License: MIT + Commons Clause License Condition v1.0. The full notice is retained in `src/components/react-bits/LICENSE.md` and served at `public/notices/react-bits-LICENSE.txt`. These components are integrated into this website; they must not be resold or redistributed as standalone components, a component bundle, or a port.

## DM Sans

DM Sans is self-hosted under the SIL Open Font License 1.1. Its license is retained at `public/notices/DM-Sans-OFL.txt`. Font source: <https://github.com/google/fonts/tree/main/ofl/dmsans>.

## Other software

React, React DOM, Vite, OGL, TypeScript, Playwright, and Prettier retain their respective upstream licenses in the installed packages. No third-party brand logos or proprietary artwork are included. The original orbit illustration and abstract site mark were created for this page.
