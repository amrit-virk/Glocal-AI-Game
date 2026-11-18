import assert from "node:assert/strict";
import { test } from "node:test";
import { completeDay, currentStreak, localDay, parseStreak } from "../src/streak";

test("completion counts once per calendar day and extends on consecutive days", () => {
  const first = completeDay(undefined, "2026-11-18");
  assert.equal(first.current, 1);
  assert.deepEqual(completeDay(first, "2026-11-18"), first);
  assert.equal(completeDay(first, "2026-11-19").current, 2);
  assert.equal(currentStreak(first, "2026-11-19"), 1);
});

test("a missed day resets current streak and retains the best", () => {
  const previous = { version: 1 as const, lastDay: "2026-11-18", current: 8, best: 12 };
  assert.equal(currentStreak(previous, "2026-11-20"), 0);
  assert.deepEqual(completeDay(previous, "2026-11-20"), {
    version: 1, lastDay: "2026-11-20", current: 1, best: 12,
  });
  assert.deepEqual(completeDay(previous, "2026-11-17"), previous);
});

test("calendar boundaries, leap days and daylight saving changes count as one day", () => {
  for (const [before, after] of [
    ["2026-12-31", "2027-01-01"],
    ["2028-02-28", "2028-02-29"],
    ["2026-03-08", "2026-03-09"],
    ["2026-11-01", "2026-11-02"],
  ]) assert.equal(completeDay(completeDay(undefined, before), after).current, 2);
  const date = new Date(2026, 10, 18, 23, 59);
  assert.equal(localDay(date), "2026-11-18");
});

test("damaged, unknown and invalid cookie data is ignored", () => {
  for (const value of [undefined, "bad", "null", "{}", JSON.stringify({
    version: 1, lastDay: "2026-02-30", current: 2, best: 2,
  }), JSON.stringify({
    version: 1, lastDay: "2026-11-18", current: -1, best: 2,
  })]) assert.equal(parseStreak(value), undefined);
});
