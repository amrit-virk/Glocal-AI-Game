import assert from "node:assert/strict";
import { test } from "node:test";
import { newGame, assess, assessClaims, claimsComplete, updateClaimReview, briefingResponse, briefingCurrent, reviewPrompt, readSave, readLibrary, planCoverage, planCost, currentObjective, taskAvailable, readyForBroadcast } from "../src/engine";
import { announcementClaims, promptExample, promptOriginal } from "../src/content";

function prepared() {
  const state = newGame(promptExample);
  for (const claim of announcementClaims) updateClaimReview(state, claim.id, { decision: claim.expected, source: "booking", reason: "current" });
  state.bulletinFiled = true;
  state.repairs = ["shuttle", "ramp"];
  state.sentPrompt = promptExample;
  state.sentBriefing = briefingResponse(promptExample, state.bulletin);
  state.sentUseful = true;
  state.late = true;
  return state;
}
test("decisions yield three distinct endings", () => {
  const state = prepared();
  assert.equal(assess(state).ending, "clear-signal");
  state.leaked = true;
  assert.equal(assess(state).ending, "last-minute-save");
  updateClaimReview(state, "entrance", { decision: "keep" });
  assert.equal(assess(state).ending, "crossed-wires");
});
test("verification rewards keeping supported AI claims as well as correcting errors", () => {
  const state = prepared();
  assert.ok(claimsComplete(state.claimReviews));
  assert.ok(assessClaims(state.claimReviews!).every((claim) => claim.passed));
  updateClaimReview(state, "day", { decision: "correct" });
  assert.equal(state.bulletin.day, "Friday");
  assert.equal(assess(state).day, false);
  assert.equal(assess(state).ending, "crossed-wires");
  updateClaimReview(state, "day", { decision: "hold" });
  assert.equal(state.bulletin.day, "unconfirmed");
  assert.equal(assess(state).day, false);
});
test("correct answers with unsupported evidence or confidence alone do not pass verification", () => {
  const state = prepared();
  updateClaimReview(state, "time", { source: "draft" });
  assert.equal(assess(state).time, true);
  assert.equal(assess(state).evidence, false);
  assert.equal(assess(state).ending, "last-minute-save");
  updateClaimReview(state, "time", { source: "booking", reason: "confidence" });
  assert.equal(assess(state).evidence, false);
  updateClaimReview(state, "time", { reason: "current" });
  assert.equal(assess(state).ending, "clear-signal");
});
test("claim checkpoints require decisions, evidence, and reasoning without grading them", () => {
  const state = newGame(promptExample);
  for (const claim of announcementClaims) updateClaimReview(state, claim.id, { decision: "keep", source: "poster", reason: "reuse" });
  assert.ok(claimsComplete(state.claimReviews));
  assert.ok(assessClaims(state.claimReviews!).every((claim) => !claim.passed));
  updateClaimReview(state, "day", { reason: "" });
  assert.equal(claimsComplete(state.claimReviews), false);
  assert.equal(state.bulletinFiled, false);
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
  assert.equal(reviewPrompt("Write a briefing with the east entrance, confirmed opening time and step-free ramp. Do not print an offline copy.").useful, false);
});
test("sent briefings reflect retained context and expose private information", () => {
  const state = prepared();
  const minimal = briefingResponse("Write a briefing.", state.bulletin);
  assert.equal(minimal.gaps.length, 4);
  assert.equal(minimal.lines.some((line) => line.includes("Print")), false);
  const useful = briefingResponse(promptExample, state.bulletin);
  assert.deepEqual(useful.gaps, []);
  assert.deepEqual(useful.shared, []);
  assert.ok(useful.lines.some((line) => line.includes("18:30")));
  assert.ok(useful.lines.some((line) => line.includes("Print a paper")));
  const privateResponse = briefingResponse(promptOriginal, state.bulletin);
  assert.ok(privateResponse.shared.includes("noor@example.test"));
  assert.ok(privateResponse.shared.includes("multiple sclerosis"));
  // A sent response is a snapshot and survives unsent edits and reload.
  state.draft = "Write a briefing.";
  assert.deepEqual(readSave(JSON.stringify(state))!.sentBriefing, useful);
});
test("saves round trip, reject malformed reviews, and derive the announcement from reviewed claims", () => {
  const state = prepared();
  assert.deepEqual(readSave(JSON.stringify(state)), state);
  assert.equal(readSave("{oops"), null);
  assert.equal(readSave(JSON.stringify({ ...state, repairs: ["shuttle", "ramp", "bus"] })), null);
  assert.equal(readSave(JSON.stringify({ ...state, scene: "unknown" })), null);
  assert.equal(readSave(JSON.stringify({ ...state, draft: null })), null);
  assert.equal(readSave(JSON.stringify({ ...state, published: true, ending: null })), null);
  assert.equal(readSave(JSON.stringify({ ...state, claimReviews: { ...state.claimReviews, day: { decision: "maybe", source: "booking", reason: "current" } } })), null);
  assert.equal(readSave(JSON.stringify({ ...state, claimReviews: null })), null);
  assert.equal(readSave(JSON.stringify({ ...state, sentBriefing: { lines: [4], gaps: [], shared: [] } })), null);
  const stale = { ...state, bulletin: { day: "Friday", time: "18:00", entrance: "front", source: "poster" } };
  assert.equal(readSave(JSON.stringify(stale))!.bulletin.time, "18:30");
  assert.deepEqual(readLibrary("bad"), { version: 1, endings: [], runs: 0 });
});
test("older active saves preserve discoveries and choices while introducing the new review step", () => {
  const state = prepared();
  const legacy = JSON.parse(JSON.stringify(state));
  legacy.evidence = ["draft", "booking"];
  delete legacy.claimReviews;
  delete legacy.sentBriefing;
  delete legacy.bulletin.day;
  delete legacy.bulletinFiled;
  delete legacy.planReviewed;
  delete legacy.latePlanReviewed;
  delete legacy.tutorials;
  const migrated = readSave(JSON.stringify(legacy))!;
  assert.deepEqual(migrated.evidence, ["draft", "booking"]);
  assert.equal(migrated.claimReviews!.time.decision, "correct");
  assert.equal(migrated.claimReviews!.time.source, "booking");
  assert.equal(migrated.claimReviews!.time.reason, "");
  assert.equal(migrated.bulletinFiled, false);
  assert.equal(migrated.planReviewed, true);
  assert.equal(migrated.latePlanReviewed, false);
  assert.deepEqual(migrated.repairs, state.repairs);
  assert.equal(migrated.sentPrompt, promptExample);
});
test("older completed shifts keep their ending and original report", () => {
  const legacy = JSON.parse(JSON.stringify(prepared()));
  legacy.published = true;
  legacy.ending = "clear-signal";
  delete legacy.claimReviews;
  delete legacy.sentBriefing;
  delete legacy.bulletin.day;
  const migrated = readSave(JSON.stringify(legacy))!;
  assert.equal(migrated.ending, "clear-signal");
  assert.equal(migrated.claimReviews, null);
  assert.equal(assess(migrated).ending, "clear-signal");
});
test("guidance follows preparation steps and requires a fresh preview after the late notice", () => {
  const state = newGame(promptExample);
  assert.equal(currentObjective(state).action, "desk");
  assert.equal(taskAvailable(state, "prompt"), false);
  state.evidence = ["draft", "booking", "poster", "roster"];
  state.met = ["mara", "ivo"];
  for (const claim of announcementClaims) updateClaimReview(state, claim.id, { decision: claim.expected, source: "booking", reason: "current" });
  state.bulletinFiled = true;
  assert.equal(currentObjective(state).action, "task:prompt");
  assert.equal(taskAvailable(state, "prompt"), true);
  state.sentPrompt = promptExample;
  state.sentBriefing = briefingResponse(promptExample, state.bulletin);
  assert.equal(currentObjective(state).action, "task:plan");
  assert.equal(readyForBroadcast(state), false);
  state.repairs = ["video"];
  state.planReviewed = true;
  assert.equal(readyForBroadcast(state), true);
  state.late = true;
  assert.equal(currentObjective(state).action, "task:plan");
  state.latePlanReviewed = true;
  assert.equal(currentObjective(state).action, "launch");
  assert.equal(assess(state).ending, "crossed-wires");
});


test("partial claim reviews survive reload without becoming filed or correct", () => {
  const state = newGame(promptExample);
  updateClaimReview(state, "time", { decision: "correct", source: "booking" });
  const resumed = readSave(JSON.stringify(state))!;
  assert.deepEqual(resumed.claimReviews, state.claimReviews);
  assert.equal(resumed.bulletinFiled, false);
  assert.equal(claimsComplete(resumed.claimReviews), false);
});
test("a request to omit diagnoses is safe, but an explicit wrong time changes the response and is flagged", () => {
  const state = prepared();
  assert.equal(reviewPrompt(promptExample + " Do not include names or diagnoses.").safe, true);
  assert.equal(reviewPrompt(promptExample + " Do not include multiple sclerosis.").safe, false);
  const wrong = "Write a briefing for opening at 18:00, the east entrance, a printed copy and step-free ramp.";
  assert.equal(reviewPrompt(wrong).useful, false);
  const response = briefingResponse(wrong, state.bulletin);
  assert.ok(response.lines.some((line) => line.includes("18:00")));
  assert.ok(response.gaps.some((gap) => gap.includes("conflicts")));
});


test("a sent briefing must be refreshed when the announcement changes, including after the late notice", () => {
  const state = prepared();
  assert.equal(briefingCurrent(state), true);
  updateClaimReview(state, "time", { reason: "confidence" });
  assert.equal(briefingCurrent(state), true);
  updateClaimReview(state, "time", { decision: "keep" });
  state.bulletinFiled = true;
  assert.equal(briefingCurrent(state), false);
  assert.equal(currentObjective(state).action, "task:prompt");
  assert.equal(readyForBroadcast(state), false);
  assert.ok(state.sentBriefing!.lines.some((line) => line.includes("18:30")));
  state.sentBriefing = briefingResponse(state.sentPrompt!, state.bulletin);
  assert.equal(briefingCurrent(state), true);
  assert.ok(state.sentBriefing.lines.some((line) => line.includes("18:00")));
});
