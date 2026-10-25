# SOZU Witness, ESP32-S3 SuperMini

Target: ESP32-S3 SuperMini, 4 MB flash, no PSRAM, ceramic antenna. Headers can remain unsoldered; USB is sufficient to flash and read serial logs. The firmware does not implement bitchat or use external pins.

Build from this directory with `python -m platformio run`. Flash later with `python -m platformio run --target upload` after connecting the board over USB.

The BLE GATT characteristic carries one 184-byte notification per connection. Its first 181 bytes are a framed, signed `SOZU2:` checkpoint from `issueCheckpoint`; the final three zero bytes are transport padding outside the signed checkpoint. The receiver must negotiate an ATT MTU of at least 187 and subscribe to notifications. A central that only supports a smaller MTU must read the characteristic instead of treating fragments as separate packets.

`vector/checkpoint-184.json` is a synthetic fixture referencing the note ID of the first accepted testnet settlement. Its vault prefix and signing key are test fixtures. Regenerate the C header from the committed vector with `node scripts/freeze-witness-vector.mjs` from the repository root.

The board-to-phone radio test remains pending until the physical board and Danilo's phone are available.
