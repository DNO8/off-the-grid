import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pins = JSON.parse(readFileSync(new URL("../forks.json", import.meta.url)));

test("both forks are pinned to a full commit", () => {
  for (const name of ["ios", "android"]) {
    const pin = pins[name];
    assert.equal(typeof pin.fork, "string");
    assert.match(pin.fork, /^https:\/\/github\.com\/Sozu-Capital\/bitchat/);
    assert.match(pin.sha, /^[0-9a-f]{40}$/);
    assert.equal(pin.upstream.startsWith("https://github.com/permissionlesstech/"), true);
  }
});

test("the android pin is the code commit, not the relay-data bot", () => {
  assert.equal(pins.android.sha, "95c0852c2b9e3428d09616f11c098a8c8cb72bc3");
  assert.equal(pins.android.license, "GPL-3.0");
});

test("the ios pin is the 2026-10-25 main commit", () => {
  assert.equal(pins.ios.sha, "04995f68e470a18d1fc99f86fa326c2a87bab4f2");
  assert.equal(pins.ios.license, "Unlicense");
});
