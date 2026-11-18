import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { games, type Verdict } from "../../src/content";

const sharingDecisions: Record<Verdict, string> = {
  "The evidence supports it": "Share as written",
  "The evidence contradicts it": "Correct before sharing",
  "There’s not enough evidence": "Hold for more evidence",
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.999; });
});

for (const game of games) {
  test(`solve all ${game.name} cases, then replay`, async ({ page }) => {
    await page.goto(`/#game/${game.id}`);
    const howTo = page.getByRole("region", { name: "How to play" });
    await expect(howTo.getByRole("listitem")).toHaveText(game.instructions);
    await page.getByRole("button", { name: "Start game" }).click();
    for (const [index, puzzle] of game.scenarios.entries()) {
      await expect(page.getByRole("heading", { name: puzzle.title })).toBeVisible();
      if (puzzle.kind === "claim") {
        const source = puzzle.evidence[puzzle.decisive].title;
        await page.getByRole("button", { name: `Read ${source}`, exact: true }).click();
        await page.getByRole("button", { name: `Use ${source} as evidence`, exact: true }).click();
        await page.getByRole("button", { name: sharingDecisions[puzzle.verdict], exact: true }).click();
        await page.getByRole("button", { name: "Submit decision" }).click();
      } else if (puzzle.kind === "privacy") {
        await page.getByRole("textbox", { name: "Your rewrite" }).fill(puzzle.example);
        await page.getByRole("button", { name: "Check rewrite" }).click();
      } else {
        for (const repair of puzzle.example) {
          await page.getByRole("button", { name: puzzle.repairs[repair].text, exact: true }).click();
        }
        await page.getByRole("button", { name: "Test the plan" }).click();
      }
      await expect(page.getByRole("heading", { name: "Case solved" })).toBeVisible();
      await expect(page.locator(".score")).toHaveCount(0);
      const next = index === game.scenarios.length - 1 ? "See results" : "Next case";
      await page.getByRole("button", { name: next }).click();
    }
    await expect(page.locator(".score")).toHaveText("4 / 4");
    await page.getByRole("button", { name: "Replay game" }).click();
    await expect(page.getByText("Case 1 of 4")).toBeVisible();
    if (game.id === "bias") {
      await expect(page.getByRole("heading", { name: /Transit change/ })).toBeVisible();
    }
  });
}

test("a submitted rewrite locks and explains the missed requirements", async ({ page }) => {
  await page.goto("/#game/privacy");
  await page.getByRole("button", { name: "Start game" }).click();
  const editor = page.getByRole("textbox", { name: "Your rewrite" });
  const check = page.getByRole("button", { name: "Check rewrite" });
  const original = page.getByRole("region", { name: "Original prompt" });
  await expect(original).toContainText("Maya Chen");
  expect((await original.boundingBox())!.y).toBeLessThan((await editor.boundingBox())!.y);
  await expect(editor).toHaveValue(/Maya Chen/);
  await editor.fill("");
  await check.click();
  await expect(page.getByRole("alert")).toHaveText("Write a prompt before checking it.");
  const incomplete = "Invite the club to a Friday meetup. Contact maya@example.test.";
  await editor.fill(incomplete);
  await check.click();
  await expect(editor).toHaveValue(incomplete);
  await expect(original).toContainText("Maya Chen");
  const leaked = page.getByRole("heading", { name: "What the AI would still receive" });
  await expect(leaked).toBeVisible();
  await expect(page.getByText("An email address", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Private details removed" })).toBeVisible();
  await expect(page.getByText("A phone number or similar sequence")).toBeVisible();
  await expect(page.getByText("Name the board-game meetup")).toBeVisible();
  await expect(editor).not.toBeEditable();
  await expect(check).toHaveCount(0);
  await expect(page.getByText("Keep Room 204 so newcomers know where to go.")).toBeVisible();
  await page.getByRole("link", { name: "Read the privacy reference" }).click();
  await page.getByRole("button", { name: "Return to game" }).click();
  await expect(editor).toHaveValue(incomplete);
  await expect(editor).not.toBeEditable();
  await page.getByRole("button", { name: "Next case" }).click();
  await expect(page.getByRole("heading", { name: "Thank the donors" })).toBeVisible();
});

test("the workshop and prompt editor fit the viewport", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Use AI with better judgment." })).toBeVisible();
  await page.getByRole("link", { name: /Privacy Protector/ }).click();
  await page.getByRole("button", { name: "Start game" }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("repair review explains the remaining barrier after a partial solution", async ({ page }) => {
  await page.goto("/#game/bias");
  await page.getByRole("button", { name: "Start game" }).click();
  await expect(page.getByRole("heading", { name: "What the AI was told" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What the AI recommended" })).toBeVisible();
  await page.getByRole("button", { name: /Saturday 9–11/ }).click();
  await page.getByRole("button", { name: "Preview for Ari" }).click();
  await expect(page.getByText("With the repairs you tested: still faces a barrier.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Preview for Sam" })).toHaveCount(0);
  await page.getByRole("button", { name: /Saturday noon–2/ }).click();
  await page.getByRole("button", { name: /Sunday 3–5 at the warehouse/ }).click();
  await expect(page.getByRole("alert")).toHaveText("Remove a repair before adding another.");
  await page.getByRole("button", { name: "Test the plan" }).click();
  await expect(page.getByText(/Ari: Still faces a barrier/)).toBeVisible();
  await expect(page.getByText(/Works for Sam and Nia. Ari is still at work/)).toBeVisible();
  await expect(page.getByText(/Capacity was in the spreadsheet/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Test the plan" })).toHaveCount(0);
});

test("the evidence board explains a wrong verdict and weaker clue", async ({ page }) => {
  await page.goto("/#game/claim");
  await page.getByRole("button", { name: "Start game" }).click();
  await expect(page.getByRole("heading", { name: "AI answer" })).toBeVisible();
  await page.getByRole("button", { name: "Submit decision" }).click();
  await expect(page.getByRole("alert")).toContainText("Choose a source and a sharing decision");
  await page.getByRole("button", { name: "Read May student services newsletter" }).click();
  await expect(page.getByRole("button", { name: "Use May student services newsletter as evidence" })).toBeFocused();
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: "Share as written", exact: true }).click();
  await page.getByRole("button", { name: "Submit decision" }).click();
  await expect(page.getByText(/Best decision: Correct before sharing/)).toBeVisible();
  await expect(page.getByText(/would miss the application deadline/)).toBeVisible();
  await expect(page.getByText(/its date predates the provider’s correction/)).toBeVisible();
  await expect(page.getByRole("heading", { name: /Stronger clue/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit decision" })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("a new run uses a shuffled order and scores missed cases at the end", async ({ page }) => {
  await page.goto("/#game/privacy");
  await page.evaluate(() => { Math.random = () => 0; });
  await page.getByRole("button", { name: "Start game" }).click();
  const puzzles = games.find((game) => game.id === "privacy")!.scenarios;
  for (const [i, puzzle] of [...puzzles.slice(1), puzzles[0]].entries()) {
    await expect(page.getByRole("heading", { name: puzzle.title })).toBeVisible();
    await page.getByRole("button", { name: "Check rewrite" }).click();
    await expect(page.getByRole("heading", { name: "Review your rewrite" })).toBeVisible();
    await expect(page.locator(".score")).toHaveCount(0);
    await page.getByRole("button", { name: i === 3 ? "See results" : "Next case" }).click();
  }
  await expect(page.locator(".score")).toHaveText("0 / 4");
});
