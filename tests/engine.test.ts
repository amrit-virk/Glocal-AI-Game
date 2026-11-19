import assert from "node:assert/strict";
import { test } from "node:test";
import { newGame, assess, reviewPrompt, readSave, readLibrary, planCoverage, planCost } from "../src/engine";
import { promptExample, promptOriginal } from "../src/content";

function prepared() {
  const state = newGame(promptExample);
  state.bulletin = { time: "18:30", entrance: "east", source: "booking" };
  state.repairs = ["shuttle", "ramp"];
  state.sentUseful = true;
  state.late = true;
  return state;
}
test("decisions yield three distinct endings", () => {
  const state = prepared();
  assert.equal(assess(state).ending, "clear-signal");
  state.leaked = true;
  assert.equal(assess(state).ending, "last-minute-save");
  state.bulletin.entrance = "front";
  assert.equal(assess(state).ending, "crossed-wires");
});
test("the late message invalidates a previously workable plan", () => {
  const state = newGame(promptExample);
  state.repairs = ["bus", "print", "ramp"];
  assert.ok(planCoverage(state).every((person) => person.works));
  state.late = true;
  assert.equal(planCoverage(state).find((person) => person.name === "Noor")?.works, false);
  state.repairs = ["shuttle", "ramp"];
  assert.ok(planCoverage(state).every((person) => person.works));
  assert.equal(planCost(state.repairs), 3);
});
test("prompt review preserves useful information without known private details", () => {
  assert.equal(reviewPrompt(promptOriginal).safe, false);
  assert.equal(reviewPrompt(promptOriginal).useful, true);
  assert.deepEqual(reviewPrompt(promptExample), { risks: [], missing: [], safe: true, useful: true });
  assert.equal(reviewPrompt("Write a briefing.").useful, false);
  assert.equal(reviewPrompt(promptExample + " Email test@example.test").safe, false);
});
test("saves round trip and invalid data is ignored", () => {
  const state = prepared();
  assert.deepEqual(readSave(JSON.stringify(state)), state);
  assert.equal(readSave("{oops"), null);
  assert.equal(readSave(JSON.stringify({ ...state, repairs: ["shuttle", "ramp", "bus"] })), null);
  assert.equal(readSave(JSON.stringify({ ...state, scene: "unknown" })), null);
  assert.equal(readSave(JSON.stringify({ ...state, draft: null })), null);
  assert.equal(readSave(JSON.stringify({ ...state, published: true, ending: null })), null);
  assert.deepEqual(readLibrary("bad"), { version: 1, endings: [], runs: 0 });
});
