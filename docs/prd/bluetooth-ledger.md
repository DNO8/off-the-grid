# PRD: Bluetooth ledger MVP

Status: ready for an agent. 2026-10-25. Parent: ADR 0001 on Expo page `cmvnwkw1n0001jq08arv0qj65`. Feature: Sozu Offline demo `cmvnw3wsl005ykw078w6baia9`, product `hack-meridian`.

Human zone above. Agent zone below. Do not re-decide the ADR.

## Problem

Two people standing together with no internet need to pass a Stellar cheque from one Android phone to the other, then prove on testnet that a second spend of the same note fails. A chat message is not that proof. A script that never crossed Bluetooth is not that proof.

## Goals

- A private message `sozu-text-1` arrives between two Android phones in airplane mode with Bluetooth on.
- The same path then carries a cheque the laptop vault already accepts.
- After the internet returns, the first settlement succeeds and the second cheque for that note is rejected. Both transactions are on an explorer.
- The APK is visibly a Sozu build. The Bluetooth stack is still bitchat.

## Non-goals

- iOS build, TestFlight, Apple Developer account.
- Stellar Passport login, passkeys, profile photos, confidential tokens, mock USDT0, NFC, a torrent stack, a new Bluetooth stack, a WebView of the Sozu PWA.
- Replacing `ChatScreen` or the mesh protocol.
- Talking to Bastian before the explorer shot exists. Passport is one slide sentence after that shot: the next account is a Stellar Passport passkey, and it registers the device key that signs offline.

## Solution

Install `sozu-offline-pay.apk` from a GitHub release of this repository. That build applies `android/sozu` onto bitchat-android at `95c0852c2b9e3428d09616f11c098a8c8cb72bc3`. Prove plain text first. In parallel, prove the vault with a laptop script. Then put that cheque in the private message.

The crowd breaks it by tapping one attack action on the demo phone, which signs the same note again. The honest path refuses a second signature. The attack action exists only in this demo build.

## Requirements

Canonical copies should also be requirement rows on the feature. Draft:

- The system shall send the private text `sozu-text-1` from one Android phone to another while both are in airplane mode with Bluetooth on and the apps in the foreground.
- The system shall reject a `SOZU1:` payload in the plain-text test.
- When a cheque already accepted by the laptop vault test is placed in a private message, the receiving phone shall show that payload as text.
- When internet returns, the system shall settle the first cheque and reject the second cheque for the same note.
- The system shall show the Sozu name in the chat header and shall leave the mesh transport code unchanged.
- If the plain-text message has not arrived 90 minutes after both apps are installed, the system shall stop. No QR fallback.

## Rollout

1. Radio. Plain text on the pinned Android fork. No cheque.
2. Ledger script. Laptop only. One note, two cheques, second settlement fails.
3. Glue. The private-message body is the cheque from step 2. Explorer shot is the definition of done.

## Open questions

- Who holds the two Android phones for step 1. Owner: Joaquín and the Android pair.
- Vault language (Rust/Soroban) is decided. The contract interface is `deposit`, `settle_batch`, `fraud_proof`, `withdraw_after_expiry`. Collateral equals the sum of note caps.

## Agent PRD

Machine-facing. Humans: the sections above are the spec.

### Skill order

Run these installed skills in order. Resolve each from `~/.claude/skills/<name>/SKILL.md`, else `~/.agents/skills/<name>/SKILL.md`. Do not re-grill.

1. `setup-matt-pocock-skills` only if `docs/agents/` is missing. Do not interview. The answers are already: issue tracker Exponential, workspace `sozu-capital`, product `hack-meridian` (`cmvnw2vxh005wkw07dnbxe4qy`), feature `cmvnw3wsl005ykw078w6baia9`. Single context: `docs/adr/`. Trunk is `main`.
2. `to-prd` — skip. This page is that PRD.
3. `to-robo-prd` — skip. This section is that zone. Verify the file names below against the pin before editing; if a path moved, stop and say so.
4. `to-tickets` — cut the three rollout steps into tracer-bullet tickets on the feature. Quiz a human before publishing if the skill says to quiz. Do not guess past `NEEDS_REFINEMENT`.
5. Per ticket, in order: `start-ticket`, then `implement` using `tdd` at the seams below, then `code-review`, then `ship-ticket`. One ticket at a time. Merge to `main` before starting a ticket that depends on it.

Seams for `tdd`:

- `protocol/text-message.mjs` in sozu-offline. Already tested by `npm test`. Extend it only when the cheque bytes are frozen. Do not assert a value by recomputing it the way the code does.
- Android: a new pure parser beside `com.bitchat.android.ui.MessageSpecialParser`. That existing object parses geohashes and URLs for display. It is not the cheque router. Do not put the ledger there.
- The vault script's public function: given two cheque byte strings, the first settlement succeeds and the second returns "note already used."

### Implementation decisions

Pin: `95c0852c2b9e3428d09616f11c098a8c8cb72bc3` on https://github.com/Sozu-Capital/bitchat-android. The pin stays unmodified. Sozu changes live in `android/sozu` and APK releases live on this repository. `./scripts/sync-forks.sh` checks the pin out under `forks/android`, which is gitignored. `./scripts/apply-android-overlay.sh` copies the Sozu changes onto that checkout.

Checked at that commit:

- App entry: `app/src/main/java/com/bitchat/android/MainActivity.kt`
- Chat UI: `ui/ChatScreen.kt`, `ui/ChatHeader.kt`, `ui/ChatViewModel.kt`
- Private chats: `ui/PrivateChatManager.kt`
- Mesh: `mesh/MessageHandler.kt`, `services/MessageRouter.kt`
- Display parsing only: `ui/MessageSpecialParser.kt`

UI change allowed in step 1: the string shown by `ChatHeader` identifies the build as Sozu. No other UI rewrite until step 3 has an explorer link.

Cheque prefix `SOZU1:` is step 3, not step 1. Step 1's payload is exactly `sozu-text-1`.

The laptop vault uses a classic account and faucet USDC. Device key is raw P-256, low-S, SHA-256 once. Passkey and WebAuthn verification are out of this MVP.

### Testing decisions

- sozu-offline: `npm test` must stay green. It checks the payload, the pins, and `bash -n scripts/sync-forks.sh`.
- Android unit tests run only on a machine with a JDK and Android SDK. This demo Mac on 2026-10-25 had neither (`java` missing, `adb` missing, `ANDROID_HOME` unset). Do not claim an install from that Mac.
- Phone test is manual. Airplane mode is the proof. An in-app offline switch is not.

### Scope map

**Radio.** Contains: debug APK from the pin, header label, private text `sozu-text-1` both ways. Excludes: cheque, vault, header rewrite beyond the name. Tracer: install two phones, airplane mode, message arrives.

**Ledger script.** Contains: deposit, settle of one cheque, rejection of a second cheque for the same note, explorer URLs in the README. Excludes: phone, Bluetooth. Tracer: one command prints two transaction hashes, the second a rejection.

**Glue.** Contains: private message body equals the cheque fixture, submit after internet returns, attack action that signs the same note again. Excludes: Passport, passkeys, confidential tokens, iOS. Tracer: the video shows airplane mode, the send, and the explorer rejection.

### Constraints and rejected alternatives

- QR fallback was rejected. Mesh failure stops the build.
- A website cannot be the mesh. iOS Safari has no Web Bluetooth.
- Paying for an Apple Developer account does not publish an iOS build by the next noon. External TestFlight waits on Beta App Review.
- Stock Play Store bitchat proves the radio only. It does not sign a cheque.
- Confidential tokens and Stellar Passport are slide lines after the explorer shot. Passport's passkey flow (`passkey-kit`, https://stellarpassport.xyz/) needs the network and a browser. It does not sign the offline cheque.
- `MessageSpecialParser` was considered as the cheque hook and rejected. It tokenizes geohashes and URLs for display.

## How to run the tests on this repo

```bash
cd /Users/JoaquinNam/Desktop/sozu-offline
git checkout test-01-plain-text
npm test
```

On a machine with a JDK and Android SDK, after `npm test`:

```bash
./scripts/sync-forks.sh
cd forks/android
./gradlew :app:testDebugUnitTest :app:assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Repeat the install on the second phone. Then airplane mode, Bluetooth on, apps in the foreground, private message `sozu-text-1`.
