import { test } from "node:test";
import assert from "node:assert/strict";
import { games, references } from "../src/content";
import { newRound, submit, evaluate } from "../src/engine";
for (const game of games)
  for (const scenario of game.scenarios) {
    test(`${scenario.id}: correct first attempt, retry, finality and both stages`, () => {
      const right = scenario.stages.map((s) => s.answers);
      const win = submit(newRound(), scenario, right);
      assert.equal(win.earned, true);
      assert.equal(win.finished, true);
      for (let stage = 0; stage < right.length; stage++) {
        const wrong = right.map((a) => [...a]);
        wrong[stage] = [];
        assert.equal(evaluate(scenario, wrong)[stage], false);
        const miss = submit(newRound(), scenario, wrong);
        assert.equal(miss.earned, false);
        assert.equal(miss.finished, false);
        const retry = submit(miss, scenario, right);
        assert.equal(retry.correct, true);
        assert.equal(retry.earned, false);
        assert.equal(retry.finished, true);
        const failedRetry = submit(miss, scenario, wrong);
        assert.equal(failedRetry.finished, true);
        assert.equal(failedRetry.correct, false);
        assert.deepEqual(submit(failedRetry, scenario, right), failedRetry);
      }
    });
  }
test("content has 12 unique complete scenarios and valid references", () => {
  const ids = new Set<string>();
  assert.equal(games.length, 3);
  for (const g of games) {
    assert.equal(g.scenarios.length, 4);
    for (const s of g.scenarios) {
      assert.ok(!ids.has(s.id));
      ids.add(s.id);
      assert.ok(s.takeaway);
      assert.ok(s.references.length);
      for (const id of s.references)
        assert.ok(references.some((r) => r.id === id));
      for (const stage of s.stages) {
        assert.ok(stage.options.length >= 3);
        assert.ok(stage.answers.length);
        for (const id of stage.answers)
          assert.ok(stage.options.some((o) => o.id === id));
      }
    }
  }
  assert.equal(ids.size, 12);
});
test("multi-select rejects a superset of the correct details", () => {
  const s = games[0].scenarios[0];
  assert.equal(
    evaluate(s, [s.stages[0].options.map((o) => o.id), s.stages[1].answers])[0],
    false,
  );
});
