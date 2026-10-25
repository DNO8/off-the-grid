# PRD: Test 01 — plain text on the bitchat forks

Status: ready to run. 2026-10-25. Parent decision: ADR 0001 (in review). This is the test plan, not the product PRD.

## What this test proves

The Sozu Capital forks of bitchat, at the pinned commits, can deliver one private text message from an iPhone to an Android phone with no internet.

The message is the string `sozu-text-1`. It is not a cheque. `SOZU1:` is out of this test.

## Pins

| Phone | Fork | Commit | License |
| --- | --- | --- | --- |
| iPhone | https://github.com/Sozu-Capital/bitchat | `04995f68e470a18d1fc99f86fa326c2a87bab4f2` | Unlicense |
| Android | https://github.com/Sozu-Capital/bitchat-android | `95c0852c2b9e3428d09616f11c098a8c8cb72bc3` | GPL-3.0 |

Both commits are unmodified bitchat. They already send text. The Android pin is the last code merge on 2026-10-24, one commit before an automated relay-data update. iOS is upstream `main` on 2026-10-25.

`npm test` checks the string, the pins, and that `scripts/sync-forks.sh` parses. It does not flash a phone. The phone run is the test that matters.

## Deploy

```bash
./scripts/sync-forks.sh
```

iPhone: open `forks/ios/bitchat.xcodeproj`, run the app on the device. Keep it in the foreground.

Android:

```bash
cd forks/android
./gradlew :app:assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Airplane mode on, then Bluetooth on, on both phones. Apps stay in the foreground.

## Pass

1. iPhone sends a private message `sozu-text-1` to the Android phone.
2. The Android phone shows that exact string.
3. The Android phone replies with `sozu-text-1`.
4. The iPhone shows that exact string.
5. Neither phone has Wi-Fi or cellular during the send. A 20-second screen recording is the artifact.

A third phone is not part of this test.

## Fail

90 minutes after both apps are installed: if the private message has not arrived, stop. ADR 0001 says this build ends. Do not start a cheque, a UI rewrite, or a new Bluetooth stack.

## Out of this test

Cheques, the vault, Secure Enclave signing, node mode, confidential tokens, USDT0, NFC, and any edit inside the bitchat trees.
