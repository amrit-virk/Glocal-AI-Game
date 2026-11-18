import assert from "node:assert/strict";
import { test } from "node:test";
import { games, references } from "../src/content";
import { inspectPrompt, testPlan } from "../src/engine";

for (const game of games) {
  for (const puzzle of game.scenarios) {
    test(puzzle.title, () => {
      assert.equal(puzzle.kind, game.id);
      for (const id of puzzle.references) assert.ok(references.some((r) => r.id === id));
      if (puzzle.kind === "claim") {
        assert.ok(puzzle.evidence[puzzle.decisive]);
      } else if (puzzle.kind === "privacy") {
        assert.equal(inspectPrompt(puzzle, puzzle.original).solved, false);
        assert.ok(inspectPrompt(puzzle, puzzle.original).exposed.length > 0);
        assert.equal(inspectPrompt(puzzle, puzzle.example).solved, true);
        assert.equal(inspectPrompt(puzzle, "").missing.length, puzzle.requirements.length);
      } else {
        assert.equal(testPlan(puzzle, new Set(puzzle.example)).solved, true);
        for (const [index, repair] of puzzle.repairs.entries()) {
          assert.equal(testPlan(puzzle, new Set([index])).solved, false);
          assert.ok(repair.helps.every((person) => puzzle.people[person]));
        }
        assert.equal(testPlan(puzzle, new Set()).solved, false);
        assert.equal(testPlan(puzzle, new Set(puzzle.repairs.map((_, i) => i))).solved, false);
      }
    });
  }
}

test("different repair combinations can solve the same case", () => {
  const puzzle = games.find((game) => game.id === "bias")!.scenarios[0];
  assert.equal(puzzle.kind, "bias");
  if (puzzle.kind !== "bias") return;
  assert.equal(testPlan(puzzle, new Set([0, 1])).solved, true);
  assert.equal(testPlan(puzzle, new Set([0, 2])).solved, true);
});

test("prompt review accepts alternate wording and flags reintroduced contact details", () => {
  const puzzle = games.find((game) => game.id === "privacy")!.scenarios[0];
  assert.ok(puzzle.kind === "privacy");
  const rewrite = "Invite people to tabletop games on Friday at 16:00 in Room 204.";
  assert.equal(inspectPrompt(puzzle, rewrite).solved, true);
  assert.deepEqual(inspectPrompt(puzzle, rewrite + " Contact x@example.test or (416) 555-0101.").exposed,
    ["An email address", "A phone number or similar sequence"]);
});

test("student context can identify someone without a name", () => {
  const puzzle = games.find((game) => game.id === "privacy")!.scenarios[2];
  assert.ok(puzzle.kind === "privacy");
  assert.deepEqual(inspectPrompt(puzzle, puzzle.example + " For our Year 11 robotics captain.").exposed,
    ["A combination of details that could identify the student"]);
});

test("the transit remix invalidates the old depot plan", () => {
  const puzzle = games.find((game) => game.id === "bias")!.scenarios[0];
  assert.ok(puzzle.kind === "bias" && puzzle.remix);
  assert.equal(testPlan(puzzle, new Set(puzzle.example)).solved, true);
  assert.equal(testPlan(puzzle.remix, new Set(puzzle.example)).solved, false);
  assert.equal(testPlan(puzzle.remix, new Set(puzzle.remix.example)).solved, true);
});
