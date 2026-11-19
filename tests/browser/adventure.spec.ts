import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { promptExample } from "../../src/content";
import { saveKey, libraryKey } from "../../src/engine";

async function finishDialogue(page: Page) {
  await expect(page.getByRole("dialog")).toBeVisible();
  while (await page.getByRole("dialog").count()) {
    const show = page.getByRole("button", { name: "Show text", exact: true });
    if (!await show.count()) break;
    await show.click();
    const next = page.getByRole("button", { name: /^(Continue|Got it)$/ });
    await next.click();
  }
}
async function start(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Start your shift" }).click();
  await finishDialogue(page);
}
async function travel(page: Page, name: string) {
  await page.getByRole("region").getByRole("button", { name: name + " →", exact: true }).click();
}
async function prepare(page: Page, privateRequest = false) {
  await start(page);
  await travel(page, "Equipment room");
  await page.getByRole("button", { name: "Read tonight’s booking", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("18:30");
  await page.getByRole("button", { name: "Return", exact: true }).click();
  await travel(page, "Sheltered courtyard");
  await page.getByRole("button", { name: "Talk to Mara", exact: true }).click();
  await finishDialogue(page);
  await page.getByRole("button", { name: "Talk to Ivo", exact: true }).click();
  await finishDialogue(page);
  await page.getByRole("button", { name: "Open desk", exact: true }).click();
  await page.getByLabel("Opening time").selectOption("18:30");
  await page.getByLabel("Tell visitors to use").selectOption("east");
  await page.getByLabel("Evidence behind your corrections").selectOption("booking");
  await page.getByRole("tab", { name: "AI request" }).click();
  if (!privateRequest) await page.getByLabel("Your request to the station assistant").fill(promptExample);
  await page.getByRole("button", { name: "Send request", exact: true }).click();
  await page.getByRole("button", { name: "Send to assistant", exact: true }).click();
}
async function finish(page: Page, fixPlan = true) {
  await page.getByRole("button", { name: "Ready for broadcast" }).click();
  await finishDialogue(page);
  await page.getByRole("button", { name: "Open desk", exact: true }).click();
  await page.getByRole("tab", { name: "Arrangements" }).click();
  if (fixPlan) {
    await page.getByRole("button", { name: /Shared pickup, with briefing sheets/ }).click();
    await page.getByRole("button", { name: /Clear and staff the east ramp/ }).click();
  }
  await page.getByRole("button", { name: "Go on air", exact: true }).click();
  await page.getByRole("button", { name: "Broadcast", exact: true }).click();
}

test("complete the story, preserve progress and unlock the clear ending", async ({ page }, info) => {
  await prepare(page);
  await page.reload();
  await page.getByRole("button", { name: "Continue your shift" }).click();
  await page.getByRole("button", { name: "Open desk", exact: true }).click();
  await expect(page.getByLabel("Opening time")).toHaveValue("18:30");
  await finish(page);
  await expect(page.getByRole("heading", { name: "A Clear Signal", exact: true })).toBeVisible();
  await expect(page.locator(".report-score")).toHaveText("5/ 5");
  await page.screenshot({ path: `ending-${info.project.name}.png`, fullPage: true });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "View ending collection" }).click();
  await expect(page.getByRole("heading", { name: "A Clear Signal", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "New shift", exact: true }).click();
  await page.getByRole("button", { name: "Start new shift", exact: true }).click();
  await finishDialogue(page);
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).endings, libraryKey)).toContain("clear-signal");
});

test("sending private details leaves a lasting consequence after a safer revision", async ({ page }) => {
  await prepare(page, true);
  await page.getByLabel("Your request to the station assistant").fill(promptExample);
  await page.getByRole("button", { name: "Send a revised request" }).click();
  await page.getByRole("button", { name: "Send to assistant" }).click();
  await finish(page);
  await expect(page.getByRole("heading", { name: "The Last-Minute Save", exact: true })).toBeVisible();
  await expect(page.getByText(/A sent request included known private details/)).toBeVisible();
});

test("unresolved arrangements produce a different ending", async ({ page }) => {
  await prepare(page);
  await finish(page, false);
  await expect(page.getByRole("heading", { name: "Crossed Wires", exact: true })).toBeVisible();
  await expect(page.getByText(/Noor needs the inland pickup/)).toBeVisible();
});

test("exploration, budget, draft saving and responsive layout", async ({ page }, info) => {
  await page.goto("/");
  await page.screenshot({ path: `title-${info.project.name}.png`, fullPage: true });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await start(page);
  await page.screenshot({ path: `world-${info.project.name}.png`, fullPage: true });
  await page.getByRole("button", { name: "Station map" }).click();
  await page.getByRole("button", { name: /Equipment room A warm printer/ }).click();
  await expect(page.getByRole("region", { name: /^Equipment room/ })).toBeVisible();
  await page.getByRole("button", { name: "Open desk", exact: true }).click();
  await page.getByRole("tab", { name: "AI request" }).click();
  await page.getByLabel("Your request to the station assistant").fill("A saved draft.");
  await page.reload();
  await page.getByRole("button", { name: "Continue your shift" }).click();
  await page.getByRole("button", { name: "Open desk", exact: true }).click();
  await page.getByRole("tab", { name: "AI request" }).click();
  await expect(page.getByLabel("Your request to the station assistant")).toHaveValue("A saved draft.");
  await page.getByRole("tab", { name: "Arrangements" }).click();
  await page.getByRole("button", { name: /Shared pickup, with briefing sheets/ }).click();
  await page.getByRole("button", { name: /Clear and staff the east ramp/ }).click();
  await page.getByRole("button", { name: /Meet the 17:50 bus/ }).click();
  await expect(page.getByText(/The crew can cover three points/)).toBeVisible();
  await page.screenshot({ path: `desk-${info.project.name}.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("bad save data returns to a playable title and storage failure is visible", async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.setItem(key, '{"version":2,"scene":"oops"}');
  }, saveKey);
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Start your shift" })).toBeVisible();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => { throw new Error("blocked"); };
  });
  await page.getByRole("button", { name: "Start your shift" }).click();
  await finishDialogue(page);
  await expect(page.getByRole("status")).toContainText("could not save progress");
});
