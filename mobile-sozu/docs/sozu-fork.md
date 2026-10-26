# Sozu Offline Android fork

This independent local repository develops Sozu Offline, a separately installed Android fork of Bitchat. This delivery prepares the separate identity, not a payment-enabled build. The focused identity test passed after an observed RED; final build and artifact checks are tracked in `odd/tasks/flutter-meshchat.md`. Published upstream APKs are not this fork.

The repository has its own Git metadata and object storage, retains upstream history and licensing, and has no configured remote. The original Bitchat checkouts and installed application remain separate and preserved.

## Identity contract

| Surface | Intended fork value |
| --- | --- |
| Application ID | `com.bitchat.droid.sozu` |
| Launcher/application label | `Sozu Offline`, consistently across locales |
| Chat header brand | `Sozu` |
| Internal shutdown action | `com.bitchat.droid.sozu.ACTION_FORCE_FINISH` |
| Internal shutdown permission | `com.bitchat.droid.sozu.permission.FORCE_FINISH`, signature-protected |
| File provider | `com.bitchat.droid.sozu.fileprovider` |

Keep the Kotlin namespace, Bluetooth UUIDs, packet codecs, Noise sessions and ordinary private-chat behavior unchanged. Preserve the existing `bitchat://verify` handler; removing it is unnecessary for separate installation and would break an existing interface. Do not weaken APK package/certificate checks to make upstream releases install as fork updates; no fork update channel is configured.

The original app and its data must be preserved. Do not uninstall it, reuse its keys, grant permissions automatically or force installation over an existing package. Local debug signing material must stay outside version control.

## Checks

Use JDK 21 and the SDK/build-tool versions pinned in `gradle/libs.versions.toml`, with isolated process-local tooling and caches.

```powershell
.\gradlew.bat :app:testDebugUnitTest --tests "com.bitchat.android.contracts.SozuForkIdentityTest" --no-daemon
.\gradlew.bat testDebugUnitTest lintDebug :app:assembleDebug --continue --no-daemon
```

Observe the focused test fail before changing production identity, then pass after the change. A tool/configuration failure is not behavioral RED. Verify the produced APK's actual package, labels, provider authorities and signing result before attempting installation; do not infer them from edited source alone.

The 28 earlier full-suite failures also reproduced on the exact upstream baseline with matching method, exception, message, frames and cause evidence. Their underlying causes are not established. `--continue` lets independent lint and assembly tasks run after a failed test task; it does not make a failing run successful. Record all failures and skips without suppressing or excluding tests.

Use the Android SDK's native metadata and signature checks on the assembled APK for package, all emitted locale labels, scoped provider/permission, launcher and verification URI assertions. A supplementary Robolectric metadata test observed `org.robolectric.default` because the existing test setup supplies no resource APK. It was retired rather than injecting expected metadata or changing every unit test's resource inputs. That test never passed and is not artifact proof; the independent compiled identity test remains in place.

Real-device coexistence, UI and mesh behavior require separate evidence. Keep phones offline for the agreed test, use synthetic nicknames/messages, and keep all clips/logs local. Do not collect device identifiers, real messages or location data.

## Payment gate

The local reference now contains the `protocol/` implementation and `cheque-vector.json` named by the coding PRD. Its revision, frozen vectors and compatible Android framing still require validation. Do not create substitute signing bytes, reuse mesh keys as a P-256 cheque signer, or call an arbitrary Stellar payment a compatible cheque.

The coding PRD describes a 330-byte framed cheque, while the current private-message content field has a 255-byte UTF-8 limit before BLE fragmentation. Compatible framing and the frozen vector must be established before sending payment data. Public/Nostr fallback is not proof of offline Bluetooth transport.

No Sozu payment action, signer, settlement or checkpoint processing has been implemented. Existing Cashu `/pay` is unrelated and must not be silently repurposed. Preserve the roster gates: private `sozu-text-1` both ways, then the small payload test, and required contract evidence before payment screens/glue.

## Source and license

Based on upstream Bitchat Android source `137ce6d01bba0b92f03ea49a9d6c9d3411a79706`. Preserve `LICENSE.md` and bundled notices. Its root license contains GPLv3 despite the upstream README's public-domain statement. No publishing or external evidence upload is authorized.
