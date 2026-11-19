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
  bulletinFiled: boolean;
  planReviewed: boolean;
  latePlanReviewed: boolean;
  tutorials: string[];
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
    bulletinFiled: false, planReviewed: false, latePlanReviewed: false, tutorials: [],
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
    ) {
      // Earlier adventure saves predate the preparation checkpoints.
      state.bulletinFiled ??= Boolean(state.bulletin.source);
      state.planReviewed ??= state.repairs.length > 0;
      state.latePlanReviewed ??= state.published;
      state.tutorials ??= [];
      if (![state.bulletinFiled, state.planReviewed, state.latePlanReviewed].every((value) => typeof value === "boolean") ||
        !validIds(state.tutorials, ["bulletin", "prompt", "plan"])) return null;
      return state;
    }
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

export type DeskTab = "bulletin" | "prompt" | "plan";

export function investigationComplete(state: GameState): boolean {
  return ["booking", "poster"].every((id) => state.evidence.includes(id as DocumentId));
}

export function volunteersKnown(state: GameState): boolean {
  return state.met.includes("mara") && state.met.includes("ivo") && state.evidence.includes("roster");
}

export function taskAvailable(state: GameState, tab: DeskTab): boolean {
  if (tab === "bulletin") return true;
  if (tab === "prompt") return investigationComplete(state) && volunteersKnown(state) && state.bulletinFiled;
  return state.sentPrompt !== null;
}

export function readyForBroadcast(state: GameState): boolean {
  return investigationComplete(state) && volunteersKnown(state) &&
    state.bulletinFiled && state.sentPrompt !== null && state.planReviewed;
}

export type Objective = {
  title: string;
  instruction: string;
  action: string;
  label: string;
  target: string;
  checks: { label: string; done: boolean }[];
};

export function currentObjective(state: GameState): Objective {
  if (state.late) {
    if (!state.bulletinFiled) return {
      title: "Save the revised bulletin",
      instruction: "You changed the public announcement. Save your bulletin at the desk before broadcasting.",
      action: "task:bulletin", label: "Review bulletin", target: "desk", checks: [],
    };
    if (!state.latePlanReviewed) return {
      title: "Recheck the transport plan",
      instruction: "The bus is cancelled. Recheck and preview your arrangements.",
      action: "task:plan", label: "Review arrangements", target: "desk",
      checks: [{ label: "Preview after the service notice", done: false }],
    };
    return {
      title: "Make the final broadcast",
      instruction: "Going on air makes your bulletin and arrangements final.",
      action: "launch", label: "Review broadcast", target: "desk", checks: [],
    };
  }
  if (!state.evidence.includes("draft")) return {
    title: "Check the AI’s announcement",
    instruction: "The AI mixed event details. Its unchecked announcement is at the desk.",
    action: "desk", label: "Open broadcast desk", target: "desk", checks: [],
  };
  if (!investigationComplete(state)) return {
    title: "Compare the original messages",
    instruction: "Compare the AI’s claims with the booking and old poster.",
    action: "travel:archive", label: "Go to equipment room", target: "archive",
    checks: [
      { label: "Booking message read", done: state.evidence.includes("booking") },
      { label: "Old poster read", done: state.evidence.includes("poster") },
    ],
  };
  if (!volunteersKnown(state)) return {
    title: "Find out what the volunteers need",
    instruction: "Hear from Mara and Ivo, and read the volunteer notes.",
    action: "travel:courtyard", label: "Go to courtyard", target: "courtyard",
    checks: [
      { label: "Mara heard", done: state.met.includes("mara") },
      { label: "Ivo heard", done: state.met.includes("ivo") },
      { label: "Private notes read", done: state.evidence.includes("roster") },
    ],
  };
  if (!state.bulletinFiled) return {
    title: "Prepare the public bulletin",
    instruction: "Use your sources to correct and save the bulletin at the desk.",
    action: "task:bulletin", label: "Edit bulletin", target: "desk", checks: [],
  };
  if (state.sentPrompt === null) return {
    title: "Prepare a briefing request",
    instruction: "Mara copied private notes into an AI request. Rewrite it before sending.",
    action: "task:prompt", label: "Open AI request", target: "desk", checks: [],
  };
  if (!state.planReviewed) return {
    title: "Make arrangements for the crew",
    instruction: "Does the AI’s video plan work for everyone? Check with the crew.",
    action: "task:plan", label: "Open arrangements", target: "desk", checks: [],
  };
  return {
    title: "Check in with Ada",
    instruction: "Your preparations are ready for a broadcast check.",
    action: "ready", label: "Check in with Ada", target: "talk:ada", checks: [],
  };
}
