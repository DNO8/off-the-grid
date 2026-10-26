import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const gradle = readFileSync(
  new URL("../android/sozu/app/build.gradle.kts", import.meta.url),
  "utf8",
);
const pins = JSON.parse(readFileSync(new URL("../forks.json", import.meta.url)));

test("the Sozu mesh overlay is our application, on the unmodified android pin", () => {
  assert.match(gradle, /applicationId = "capital\.sozu\.mesh"/);
  assert.equal(pins.android.sha, "95c0852c2b9e3428d09616f11c098a8c8cb72bc3");
  assert.match(pins.android.note, /sozu-offline/);
});
