# Vini testnet traffic — 2026-10-26 UTC

Vault: [`CDSCQSVWKTYR7EUJK5EQXIFI4L2C4LCPQOIUYP6PMG6KW4O2BZGCRLLV`](https://stellar.expert/explorer/testnet/contract/CDSCQSVWKTYR7EUJK5EQXIFI4L2C4LCPQOIUYP6PMG6KW4O2BZGCRLLV). The frozen `SOZU1:` body/signature/wire lengths are 179/64/243 bytes. Each accepted cheque used a fresh note ID, amount 0.001 USDC, and `DEMO_FEE` of 0.01 USDC. The original demo owner's remaining collateral was not selected.

## Fresh funding and collateral

| Owner | Faucet claim | New deposit |
| --- | --- | --- |
| `GCIIRKBHOVSXPHU2V2BXLJVTUVLDU5G2NSQ2HAU36K2KHFOU6J66VAHL` | [100 USDC](https://stellar.expert/explorer/testnet/tx/a98d3550fcc8e79e29cc891cec959fc417d1418b9f8ee09f2da89ea832959b41) | [10 USDC](https://stellar.expert/explorer/testnet/tx/8d28a366f5b2d7ce961fea170da2e0ffafae8260eb3540ff3648c57917c5b55a) |
| `GBTZA33Y3XT3U3WOZXG6Q7GJ7NDZJTBAWPKPAE4KMWUMFROGZEVZN2SC` | [100 USDC](https://stellar.expert/explorer/testnet/tx/f971ef0a348e7a5b5c76326b1a8ba6ec7438f157d06c364786b36d5e3631d9b4) | [10 USDC](https://stellar.expert/explorer/testnet/tx/76ed1fce90da74f0db6346a349a820142c1293883d0906cfe6bc3ad99eac1426) |
| `GDSHFTZIBRVINP6WVHYZTBJXALP4YBBLCACCBXVQXEQH3CXWMYRWTNH3` | [100 USDC](https://stellar.expert/explorer/testnet/tx/a4c59bbe1a586762ac62a0cc12700ee61ee8d0f1713894d1f1f14b6e6e7a4575) | [10 USDC](https://stellar.expert/explorer/testnet/tx/cc0144b155b7ae65a177a22a226e67c8c4269f0144edffdad72e078efb265c13) |

The faucet CLI also generated two additional accounts, funded them through Friendbot, and created USDC trustlines. Their USDC claims were rejected by the faucet's network-address limit. They served only as XLM fee channels; neither signed a cheque, owned collateral, nor received a settle fee.

## Real settle windows

| Window | UTC interval | Confirmed | Duration | Average | Transaction sources | Settlers | Explorer samples |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| ~8 minutes | 00:00:09–00:08:27 | 266 of 267 attempts | 8 min 19 s | 32.0/min | 4 | 1 | [first](https://stellar.expert/explorer/testnet/tx/f02a645240182d79ff205bb03a46242a2d1a78c1187a3373e09024bf2dd55111), [last](https://stellar.expert/explorer/testnet/tx/b9c5443c05f70708d17a7fb87b269d2fa31305c711966b9853783189d5a3d368) |
| ~16 minutes | 00:08:49–00:24:56 | 517 of 517 attempts | 16 min 7 s | 32.1/min | 5 | 1 | [first](https://stellar.expert/explorer/testnet/tx/3c553dd1067d72ff714bdc8ce2dfa1659a69ce42d6e8e3861ca85b3691afff65), [last](https://stellar.expert/explorer/testnet/tx/579418f7cba7d72bcb5c1d8523ad3d8c40485b4025c825b0609295f42c9c6b28) |

The actual per-minute confirmed counts varied. The ~8-minute window recorded `27, 28, 33, 37, 34, 34, 32, 33`, plus 8 in the 19-second tail. The ~16-minute window recorded `28, 34, 30, 32, 31, 32, 34, 35, 32, 36, 29, 35, 29, 31, 33, 33`, plus 3 in the 7-second tail. One attempt in the short window returned `tx_bad_seq` before confirmation and is excluded from the accepted count and public ledger. The long window had no submission failures.

Every confirmed settle returned fee `100_000` minor units to the one selected settler for that window. A second, differently signed cheque for an already spent note [returned `note-used` and fee zero](https://stellar.expert/explorer/testnet/tx/7e914fbd6249a7e7ba9ccd5e44ee279337a85340222d34f6d371783c1a41a98d). The second settler's Horizon USDC balance was 95.875 before and after that transaction.

The sanitized [transaction ledger](vini-testnet-ledger.jsonl) contains all 887 finalized hashes from setup probes and the two windows, including the duplicate rejection. The landing build exposes the same snapshot at `/api/offline/ledger`; the local API can follow the live event log. The ESP32 firmware compiled, but no board appeared on USB, so there was no physical BLE packet or phone radio test. The 184-byte packet remains a committed firmware vector pending hardware verification.
