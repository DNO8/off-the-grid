# Sozu mesh APK

The installable Sozu pay app is a GitHub release of this repository. The asset is `sozu-offline-pay.apk`.

https://github.com/Sozu-Capital/sozu-offline/releases

`android/sozu/` is the Sozu change set: application id `capital.sozu.mesh`, the pay screen, and the cheque signer. It is applied onto bitchat-android at the pin in `forks.json`. That pin stays unmodified. Sozu releases are not published from `Sozu-Capital/bitchat-android`.

The mesh app is a derivative of bitchat-android and stays GPL-3.0. Corresponding source for a release is this overlay plus that pinned commit (`permissionlesstech/bitchat-android` at `forks.json` → `android.sha`).

```bash
./scripts/sync-forks.sh
./scripts/apply-android-overlay.sh
```

The next signed build is the **Sozu APK** workflow in this repository. It needs the `SOZU_STORE_B64` and `SOZU_STORE_PASS` Actions secrets on `Sozu-Capital/sozu-offline`.
