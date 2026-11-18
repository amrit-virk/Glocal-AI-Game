import { test, expect } from "@playwright/test";

test("only a finished game adds a day and repeated finishes count once", async ({ page, context }) => {
  await page.goto("/#game/privacy");
  await page.getByRole("button", { name: "Start game" }).click();
  for (let i = 0; i < 4; i++) {
    expect((await context.cookies()).some((cookie) => cookie.name === "ai_arcade_streak_v1")).toBe(false);
    await page.getByRole("button", { name: "Check rewrite" }).click();
    await page.getByRole("button", { name: i === 3 ? "See results" : "Next case" }).click();
  }
  const streak = page.getByRole("region", { name: "Daily streak" });
  await expect(streak).toContainText("Today’s practice is complete");
  await expect(streak.locator("dd")).toHaveText(["1 day", "1 day"]);
  await page.reload();
  await expect(page.getByRole("region", { name: "Daily streak" }).locator("dd")).toHaveText(["1 day", "1 day"]);
  await page.goto("/#game/privacy");
  await page.getByRole("button", { name: "Start game" }).click();
  for (let i = 0; i < 4; i++) {
    await page.getByRole("button", { name: "Check rewrite" }).click();
    await page.getByRole("button", { name: i === 3 ? "See results" : "Next case" }).click();
  }
  await expect(streak.locator("dd")).toHaveText(["1 day", "1 day"]);
});

test("cookie history extends across midnight and resets after a missed day", async ({ page, context }) => {
  await page.clock.install({ time: new Date("2026-11-18T12:00:00") });
  await context.addCookies([{
    name: "ai_arcade_streak_v1",
    value: encodeURIComponent(JSON.stringify({ version: 1, lastDay: "2026-11-17", current: 3, best: 7 })),
    url: "http://127.0.0.1:4173",
  }]);
  await page.goto("/#game/privacy");
  await page.getByRole("button", { name: "Start game" }).click();
  for (let i = 0; i < 4; i++) {
    await page.getByRole("button", { name: "Check rewrite" }).click();
    await page.getByRole("button", { name: i === 3 ? "See results" : "Next case" }).click();
  }
  await expect(page.getByRole("region", { name: "Daily streak" }).locator("dd")).toHaveText(["4 days", "7 days"]);
  await page.clock.setSystemTime(new Date("2026-11-20T12:00:00"));
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Daily streak" }).locator("dd")).toHaveText(["0 days", "7 days"]);
});

test("blocked cookies allow completion and display the save failure", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, "cookie", { get: () => "", set: () => {} });
  });
  await page.goto("/#game/privacy");
  await page.getByRole("button", { name: "Start game" }).click();
  for (let i = 0; i < 4; i++) {
    await page.getByRole("button", { name: "Check rewrite" }).click();
    await page.getByRole("button", { name: i === 3 ? "See results" : "Next case" }).click();
  }
  await expect(page.getByRole("status")).toContainText("couldn’t save this streak");
  await expect(page.locator(".score")).toHaveText("0 / 4");
});
