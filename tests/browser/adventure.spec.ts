import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { promptExample } from "../../src/content";
import { saveKey, libraryKey } from "../../src/engine";

test.use({ reducedMotion: "reduce" });

async function finishDialogue(page: Page) {
  await expect(page.getByRole("button", { name: "Reveal or advance dialogue" })).toBeVisible();
  while (await page.getByRole("button", { name: "Reveal or advance dialogue" }).count()) {
    await page.getByRole("button", { name: "Reveal or advance dialogue" }).click();
  }
}
async function enterTask(page: Page) {
  await expect(page.getByRole("dialog")).toBeVisible();
  if (await page.getByRole("button", { name: "Open task", exact: true }).count()) {
    await page.getByRole("button", { name: "Open task", exact: true }).click();
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
  await expect(page.getByRole("heading", { name: "Check the AI’s announcement" })).toBeVisible();
  await page.getByRole("button", { name: "Open the broadcast desk" }).click();
  await expect(page.getByRole("heading", { name: "Check the AI’s announcement" })).toBeVisible();
  await enterTask(page);
  await expect(page.getByRole("heading", { name: "Check the originals first" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "AI-generated announcement · unchecked" })).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("The AI used a booking message and an older poster");
  await expect(page.getByRole("button", { name: "Go to equipment room" })).toHaveCount(0);
  await page.getByRole("button", { name: "Back to the room", exact: true }).click();
  await travel(page, "Equipment room");
  await page.getByRole("button", { name: "Read tonight’s booking", exact: true }).click();
  await page.getByRole("button", { name: "Return", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Compare the original messages" })).toBeVisible();
  await page.getByRole("button", { name: "Inspect the old poster", exact: true }).click();
  await page.getByRole("button", { name: "Return", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Find out what the volunteers need" })).toBeVisible();
  await travel(page, "Sheltered courtyard");
  await page.getByRole("button", { name: "Talk to Mara", exact: true }).click();
  await finishDialogue(page);
  await page.getByRole("button", { name: "Talk to Ivo", exact: true }).click();
  await finishDialogue(page);
  await page.getByRole("button", { name: "Read private volunteer notes", exact: true }).click();
  await page.getByRole("button", { name: "Return", exact: true }).click();
  await travel(page, "Broadcast room");
  await page.getByRole("button", { name: "Open the broadcast desk", exact: true }).click();
  await page.getByLabel("Opening time").selectOption("18:30");
  await page.getByLabel("Tell visitors to use").selectOption("east");
  await page.getByLabel("Evidence behind your corrections").selectOption("booking");
  await page.getByRole("button", { name: "Save bulletin", exact: true }).click();
  await page.getByRole("button", { name: "Open AI request", exact: true }).click();
  await enterTask(page);
  if (!privateRequest) await page.getByLabel("Your request to the station assistant").fill(promptExample);
  await page.getByRole("button", { name: "Send request", exact: true }).click();
  await page.getByRole("button", { name: "Send to assistant", exact: true }).click();
}
async function finish(page: Page, fixPlan = true) {
  await page.getByRole("button", { name: "Open arrangements", exact: true }).click();
  await enterTask(page);
  // This initially works. The later notice changes one part of the plan.
  for (const repair of [/Meet the 17:50 bus/, /Print a briefing sheet/, /Clear and staff the east ramp/]) {
    await page.getByRole("button", { name: repair }).click();
  }
  await page.getByRole("button", { name: "Preview the plan" }).click();
  await page.getByRole("button", { name: "Check in with Ada", exact: true }).click();
  await finishDialogue(page);
  await expect(page.getByRole("heading", { name: "Recheck the transport plan" })).toBeVisible();
  await page.getByRole("button", { name: "Open the broadcast desk", exact: true }).click();
  if (fixPlan) {
    await page.getByRole("button", { name: /Meet the 17:50 bus/ }).click();
    await page.getByRole("button", { name: /Print a briefing sheet/ }).click();
    await page.getByRole("button", { name: /Shared pickup, with briefing sheets/ }).click();
  }
  await page.getByRole("button", { name: "Preview the plan" }).click();
  await page.getByRole("button", { name: "Review broadcast", exact: true }).click();
  await page.getByRole("button", { name: "Broadcast", exact: true }).click();
}

test("guided objectives lead through the story and preserve progress", async ({ page }, info) => {
  await prepare(page);
  await page.reload();
  await page.getByRole("button", { name: "Continue your shift" }).click();
  await expect(page.getByRole("heading", { name: "Make arrangements for the crew" })).toBeVisible();
  await page.getByRole("button", { name: "Open the broadcast desk", exact: true }).click();
  await enterTask(page);
  await finish(page);
  await expect(page.getByRole("heading", { name: "A Clear Signal", exact: true })).toBeVisible();
  await expect(page.locator(".report-score")).toHaveText("5/ 5");
  await page.screenshot({ path: `ending-${info.project.name}.png`, fullPage: true });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "View ending collection" }).click();
  await page.getByRole("button", { name: /Endings ·/ }).click();
  await expect(page.getByRole("heading", { name: "A Clear Signal", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "New shift", exact: true }).click();
  await page.getByRole("button", { name: "Start new shift", exact: true }).click();
  await finishDialogue(page);
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).endings, libraryKey)).toContain("clear-signal");
});

test("private details still have consequences after a safer revision", async ({ page }) => {
  await prepare(page, true);
  await page.getByLabel("Your request to the station assistant").fill(promptExample);
  await page.getByRole("button", { name: "Send a revised request" }).click();
  await page.getByRole("button", { name: "Send to assistant" }).click();
  await finish(page);
  await expect(page.getByRole("heading", { name: "The Last-Minute Save", exact: true })).toBeVisible();
});

test("completion checkpoints allow an unsuccessful final plan", async ({ page }) => {
  await prepare(page);
  await finish(page, false);
  await expect(page.getByRole("heading", { name: "Crossed Wires", exact: true })).toBeVisible();
});

test("menu, tutorial, locked tasks, and keyboard dialogue are clear", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.getByText("Click people, objects, and exits.")).toBeVisible();
  await expect(page.getByText(/An AI wrote the announcement. Some details are wrong./)).toBeVisible();
  await page.screenshot({ path: `menu-${info.project.name}.png`, fullPage: true });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await start(page);
  await page.screenshot({ path: `objective-${info.project.name}.png`, fullPage: true });
  await page.getByRole("button", { name: "Open the broadcast desk" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({ path: `tutorial-${info.project.name}.png`, fullPage: true });
  await enterTask(page);
  await page.screenshot({ path: `desk-${info.project.name}.png`, fullPage: true });
  await page.getByRole("tab", { name: /AI request/ }).click();
  await expect(page.getByRole("heading", { name: "Compare the original messages" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send request", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("clicking dialogue reveals it and then advances it", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.getByRole("button", { name: "Start your shift" }).click();
  await expect(page.getByRole("button", { name: "Show text" })).toHaveCount(0);
  const speech = page.getByRole("button", { name: "Reveal or advance dialogue" });
  await speech.click();
  await expect(page.locator("#speech")).toContainText("People will follow");
  await expect(page.locator(".speech-head")).toContainText("1/2");
  await speech.press("Enter");
  await expect(page.locator(".speech-head")).toContainText("2/2");
});

test("bad save data and blocked storage remain recoverable", async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.setItem(key, '{"version":2,"scene":"oops"}');
  }, saveKey);
  await page.goto("/");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => { throw new Error("blocked"); };
  });
  await page.getByRole("button", { name: "Start your shift" }).click();
  await finishDialogue(page);
  await expect(page.getByRole("status")).toContainText("could not save progress");
});
