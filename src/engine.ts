import { arrangements, type DocumentId, type EndingId, type PersonId, type SceneId } from "./content";

export type Bulletin = { time: string; entrance: string; source: string };
export type GameState = {
  version: 2;
  scene: SceneId;
  evidence: DocumentId[];
  met: PersonId[];
  bulletin: Bulletin;
  draft: string;
  sentPrompt: string | null;
  leaked: boolean;
  sentUseful: boolean;
  repairs: string[];
  late: boolean;
  published: boolean;
  ending: EndingId | null;
};
export type Library = { version: 1; endings: EndingId[]; runs: number };
export const saveKey = "last_light_save_v2";
export const libraryKey = "last_light_endings_v1";

export function newGame(draft: string): GameState {
  return {
    version: 2, scene: "studio", evidence: [], met: [],
    bulletin: { time: "18:00", entrance: "front", source: "" },
    draft, sentPrompt: null, leaked: false, sentUseful: false,
    repairs: [], late: false, published: false, ending: null,
  };
}

export function reviewPrompt(prompt: string) {
  const text = prompt.normalize("NFKC").toLowerCase();
  const risks: string[] = [];
  if (/\b(?:noor|patel|ivo|rae)\b/i.test(text)) risks.push("Volunteer names are unnecessary for a general briefing. Use roles or access requirements.");
  if (/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(text)) risks.push("The email address would be shared. Ask for a general briefing and address it through the station’s own process.");
  if (/(?<!\d)(?:\d[ ()+.-]*){7,}(?!\d)/.test(text)) risks.push("Contact numbers are private planning details. Remove them from the request.");
  if (/multiple sclerosis|diagnos|medical condition/i.test(text)) risks.push("The diagnosis would be shared. State the step-free access requirement without the medical background.");
  const missing: string[] = [];
  if (!/brief|instruct|guide|checklist/i.test(text)) missing.push("Ask for a briefing or instructions.");
  if (!/east/i.test(text)) missing.push("Keep the confirmed east entrance.");
  if (!/offline|print|paper/i.test(text)) missing.push("Include a printable or offline version.");
  if (!/opening|18[:.]30|6[:.]30|confirmed time/i.test(text)) missing.push("Ask for the confirmed opening time.");
  return { risks, missing, safe: risks.length === 0, useful: missing.length === 0 };
}

export function planCost(repairs: string[]): number {
  return arrangements.filter((item) => repairs.includes(item.id)).reduce((sum, item) => sum + item.cost, 0);
}

export function planCoverage(state: Pick<GameState, "repairs" | "late">) {
  return [
    { name: "Noor", works: state.repairs.includes("shuttle") || (!state.late && state.repairs.includes("bus")), reason: state.late ? "The harbour bus is cancelled. Noor needs the inland pickup." : "Noor needs the bus meeting or a shared pickup." },
    { name: "Ivo", works: state.repairs.includes("print") || state.repairs.includes("shuttle"), reason: "Ivo needs a paper briefing. The pickup can carry it with the tools." },
    { name: "Rae", works: state.repairs.includes("ramp"), reason: "The east ramp needs its trolley moved and a greeter." },
  ];
}

export function assess(state: GameState) {
  const time = state.bulletin.time === "18:30";
  const entrance = state.bulletin.entrance === "east";
  const evidence = state.bulletin.source === "booking";
  const coverage = planCoverage(state);
  const access = planCost(state.repairs) <= 3 && coverage.every((person) => person.works);
  const privacy = !state.leaked && state.sentUseful;
  const ending: EndingId = time && entrance && evidence && access
    ? privacy ? "clear-signal" : "last-minute-save"
    : "crossed-wires";
  return { time, entrance, evidence, coverage, access, privacy, ending };
}

export function readSave(value: string | null): GameState | null {
  try {
    const state = JSON.parse(value ?? "") as GameState;
    const docs = ["draft", "booking", "poster", "roster", "update"];
    const persons = ["ada", "mara", "ivo"];
    const validIds = (items: unknown, ids: string[]): items is string[] =>
      Array.isArray(items) && items.every((item) => typeof item === "string" && ids.includes(item)) &&
      new Set(items).size === items.length;
    if (
      state?.version === 2 && ["studio", "archive", "courtyard"].includes(state.scene) &&
      validIds(state.evidence, docs) && validIds(state.met, persons) &&
      typeof state.draft === "string" && state.draft.length <= 1600 &&
      (state.sentPrompt === null || typeof state.sentPrompt === "string" && state.sentPrompt.length <= 1600) &&
      ["18:00", "18:30"].includes(state.bulletin?.time) &&
      ["front", "east"].includes(state.bulletin?.entrance) &&
      ["", "booking", "poster", "draft"].includes(state.bulletin?.source) &&
      validIds(state.repairs, arrangements.map((item) => item.id)) && planCost(state.repairs) <= 3 &&
      [state.leaked, state.sentUseful, state.late, state.published].every((value) => typeof value === "boolean") &&
      [null, "clear-signal", "last-minute-save", "crossed-wires"].includes(state.ending) &&
      state.published === (state.ending !== null)
    ) return state;
  } catch {
    // An invalid save returns to the title screen.
  }
  return null;
}

export function readLibrary(value: string | null): Library {
  try {
    const library = JSON.parse(value ?? "") as Library;
    const known = ["clear-signal", "last-minute-save", "crossed-wires"];
    if (library?.version === 1 && Array.isArray(library.endings) &&
      library.endings.every((ending) => known.includes(ending)) &&
      Number.isSafeInteger(library.runs) && library.runs >= 0) {
      return { ...library, endings: [...new Set(library.endings)] };
    }
  } catch {
    // Ending history is independent of the current adventure.
  }
  return { version: 1, endings: [], runs: 0 };
}
