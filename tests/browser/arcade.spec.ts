import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { games } from "../../src/content";
for (const game of games) {
  test(`${game.name}: complete, feedback, sources and replay`, async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("link", { name: "Explore game" })
      .nth(games.indexOf(game))
      .click();
    await page.getByRole("button", { name: "Start game" }).click();
    for (let i = 0; i < 4; i++) {
      const s = game.scenarios[i];
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(s.title);
      for (let j = 0; j < s.stages.length; j++) {
        for (const id of s.stages[j].answers)
          await page
            .getByLabel(s.stages[j].options.find((o) => o.id === id)!.text, {
              exact: true,
            })
            .check();
        await page
          .getByRole("button", {
            name: j === s.stages.length - 1 ? "Submit answer" : "Next step",
          })
          .click();
      }
      await expect(
        page.getByRole("heading", { name: "Correct — well spotted!" }),
      ).toBeVisible();
      if (i === 0) {
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual(
          [],
        );
        await page
          .getByRole("link", {
            name:
              game.id === "privacy"
                ? "Office of the Privacy Commissioner of Canada"
                : game.id === "claim"
                  ? "National Institute of Standards and Technology"
                  : "UNESCO",
            exact: true,
          })
          .click();
        await expect(
          page.getByRole("heading", { name: "Sources & review notes" }),
        ).toBeVisible();
        await page.getByRole("button", { name: "Return to game" }).click();
        await expect(
          page.getByRole("heading", { name: "Correct — well spotted!" }),
        ).toBeVisible();
      }
      await page
        .getByRole("button", {
          name: i === 3 ? "See results" : "Continue",
          exact: true,
        })
        .click();
    }
    await expect(page.locator(".score")).toHaveText("4 / 4");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.getByRole("button", { name: "Replay game" }).click();
    await expect(page.getByText("Scenario 1 of 4 · Score 0/4")).toBeVisible();
  });
}
test("incorrect retry, best answer reveal and unchanged first-attempt score", async ({
  page,
}) => {
  await page.goto("/#game/claim");
  await page.getByRole("button", { name: "Start game" }).click();
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "Choose an answer before continuing.",
  );
  await page.getByRole("radio").nth(1).check();
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(
    page.getByText("No point this round. Try once more for practice."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Retry for practice" }).click();
  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(page.getByText("Best answer:", { exact: false })).toBeVisible();
  await expect(page.getByText("Scenario 1 of 4 · Score 0/4")).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Did they really say that?" }),
  ).toBeVisible();
});
test("keyboard flow, responsive layout and accessibility", async ({ page }) => {
  await page.goto("/");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await page.goto("/#game/privacy");
  await page.getByRole("button", { name: "Start game" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("checkbox").first()).toBeVisible();
  await expect(page.locator("main")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("checkbox").first()).toBeFocused();
  await page.keyboard.press("Space");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("radio").first()).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/${test.info().project.name}-scenario.png`,
    fullPage: true,
  });
});
test("two-step edits persist and a zero-score game still completes", async ({
  page,
}) => {
  await page.goto("/#game/privacy");
  await page.getByRole("button", { name: "Start game" }).click();
  for (let i = 0; i < 4; i++) {
    for (let attempt = 0; attempt < 2; attempt++) {
      await page.getByRole("checkbox").last().check();
      await page.getByRole("button", { name: "Next step" }).click();
      if (i === 0 && attempt === 0) {
        await page.getByRole("button", { name: "Back to step 1" }).click();
        await expect(page.getByRole("checkbox").last()).toBeChecked();
        await page.getByRole("button", { name: "Next step" }).click();
      }
      await page.getByRole("radio").first().check();
      await page.getByRole("button", { name: "Submit answer" }).click();
      if (attempt === 0)
        await page.getByRole("button", { name: "Retry for practice" }).click();
    }
    await expect(
      page.getByText("Best answer:", { exact: false }).first(),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: i === 3 ? "See results" : "Continue",
        exact: true,
      })
      .click();
  }
  await expect(page.locator(".score")).toHaveText("0 / 4");
  await page.getByRole("link", { name: "Return home" }).click();
  await expect(
    page.getByRole("heading", { name: "Choose your challenge" }),
  ).toBeVisible();
});
test("sources preserve intro and result screens", async ({ page }) => {
  await page.goto("/#game/claim");
  await page.getByRole("link", { name: "Sources", exact: true }).click();
  await page.getByRole("button", { name: "Return to game" }).click();
  await expect(page.getByRole("button", { name: "Start game" })).toBeVisible();
});
