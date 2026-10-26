import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const builds = [
  {
    name: "ARM64",
    filename: "bitchat-android-arm64.apk",
    bytes: 19_977_772,
    sha256: "236450d653e357d775ad210a0f2a492f8ac5147be4ef9052b648dc4fc31fc1b0",
  },
  {
    name: "Universal",
    filename: "bitchat-android-universal.apk",
    bytes: 51_915_500,
    sha256: "1ee83d51f73e0f08c0938873399fad3ca741bedd47e0421bf43c950b5436fe7c",
  },
];

test("shows exactly two download actions and the real release identity", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Pay offline",
  );
  await expect(page.getByText("Sozu Offline")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "What it does" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "How it works" }),
  ).toBeVisible();
  await expect(page.getByText("v2.0.3", { exact: true })).toBeVisible();
  await expect(page.locator(".downloads a")).toHaveCount(2);
  await expect(
    page.getByRole("link", { name: "GitHub repository" }),
  ).toHaveAttribute("href", "https://github.com/Sozu-Capital/sozu-offline");
  await expect(page.getByRole("link", { name: "Twitter" })).toHaveAttribute(
    "href",
    "https://x.com/sozucapital",
  );
  for (const build of builds) {
    await expect(
      page.getByRole("link", {
        name: `Download Bitchat ${build.name} APK`,
        exact: true,
      }),
    ).toHaveAttribute("href", `/downloads/${build.filename}`);
  }
});

for (const build of builds) {
  test(`downloads the original ${build.name} APK without changing its bytes`, async ({
    page,
  }) => {
    await page.goto("/");
    const pending = page.waitForEvent("download");
    await page
      .getByRole("link", {
        name: `Download Bitchat ${build.name} APK`,
        exact: true,
      })
      .click();
    const download = await pending;
    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toBe(build.filename);
    const bytes = await readFile((await download.path())!);
    expect(bytes.length).toBe(build.bytes);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(build.sha256);
  });
}

test("renders Ghost Fibers behind two interactive Dither Veil download cards", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".background .ghost-fibers-canvas")).toHaveCount(1);
  await expect(page.locator(".download-card .dither-veil canvas")).toHaveCount(
    2,
  );
  const card = page.getByRole("link", {
    name: "Download Bitchat ARM64 APK",
    exact: true,
  });
  await card.hover({ position: { x: 60, y: 50 } });
  await page.mouse.move(500, 600, { steps: 8 });
  await page.waitForTimeout(1500);
  for (const canvas of await page.locator("canvas").all()) {
    expect(
      await canvas.evaluate(
        (node: HTMLCanvasElement) => node.width > 0 && node.height > 0,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("desktop.png"),
    fullPage: true,
  });
});

test("keeps both downloads visible and keyboard accessible on mobile", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  for (const build of builds) {
    await expect(
      page.getByRole("link", {
        name: `Download Bitchat ${build.name} APK`,
        exact: true,
      }),
    ).toBeVisible();
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Download Bitchat ARM64 APK", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", {
      name: "Download Bitchat Universal APK",
      exact: true,
    }),
  ).toBeFocused();
  await page.locator("main").evaluate(async (node) => {
    await Promise.all(
      node.getAnimations().map((animation) => animation.finished),
    );
    await document.fonts.ready;
  });
  await page.screenshot({
    path: testInfo.outputPath("mobile.png"),
    fullPage: true,
  });
});

test("preserves the download actions when WebGL is unavailable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type,
      ...args
    ) {
      if (
        type === "webgl2" ||
        type === "webgl" ||
        type === "experimental-webgl"
      )
        return null;
      return Reflect.apply(getContext, this, [type, ...args]);
    } as typeof getContext;
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("link")).toHaveCount(2);
  expect(errors).toEqual([]);
});

test("respects reduced motion without removing either download", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("link")).toHaveCount(2);
  await expect(page.locator("canvas")).toHaveCount(0);
});
