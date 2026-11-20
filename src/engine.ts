import { announcementClaims, claimReasons, arrangements, type ClaimId, type DocumentId, type EndingId, type PersonId, type SceneId } from "./content";

export type Bulletin = { day: string; time: string; entrance: string; source: string };
export type ClaimReview = { decision: "" | "keep" | "correct" | "hold"; source: "" | "booking" | "poster" | "draft"; reason: "" | "current" | "confidence" | "reuse" };
export type ClaimReviews = Record<ClaimId, ClaimReview>;
export function emptyClaimReviews(): ClaimReviews {
  return { day: { decision: "", source: "", reason: "" }, time: { decision: "", source: "", reason: "" }, entrance: { decision: "", source: "", reason: "" } };
}
export function claimsComplete(reviews: ClaimReviews | null): boolean {
  return reviews !== null && announcementClaims.every(({ id }) => Boolean(reviews[id].decision && reviews[id].source && reviews[id].reason));
}
export function updateClaimReview(state: GameState, id: ClaimId, patch: Partial<ClaimReview>) {
  if (!state.claimReviews) return;
  Object.assign(state.claimReviews[id], patch);
  const { day, time, entrance } = state.claimReviews;
  state.bulletin = {
    day: day.decision === "keep" ? "Saturday" : day.decision === "correct" ? "Friday" : "unconfirmed",
    time: time.decision === "keep" ? "18:00" : time.decision === "correct" ? "18:30" : "unconfirmed",
    entrance: entrance.decision === "keep" ? "front" : entrance.decision === "correct" ? "east" : "unconfirmed",
    source: time.source,
  };
  state.bulletinFiled = false;
}
export function assessClaims(reviews: ClaimReviews) {
  return announcementClaims.map((claim) => {
    const review = reviews[claim.id];
    const decision = review.decision === claim.expected;
    const source = review.source === "booking";
    const reason = review.reason === "current";
    return { ...claim, review, decision, source, reason, passed: decision && source && reason };
  });
}
export type Briefing = { lines: string[]; gaps: string[]; shared: string[]; basis: Pick<Bulletin, "day" | "time" | "entrance"> };
export type GameState = {
  version: 2;
  scene: SceneId;
  evidence: DocumentId[];
  met: PersonId[];
  bulletin: Bulletin;
  claimReviews: ClaimReviews | null;
  draft: string;
  sentPrompt: string | null;
  sentBriefing: Briefing | null;
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
    bulletin: { day: "unconfirmed", time: "unconfirmed", entrance: "unconfirmed", source: "" },
    claimReviews: emptyClaimReviews(),
    draft, sentPrompt: null, sentBriefing: null, leaked: false, sentUseful: false,
    repairs: [], late: false, published: false, ending: null,
    bulletinFiled: false, planReviewed: false, latePlanReviewed: false, tutorials: [],
  };
}

function promptContext(prompt: string) {
  const text = prompt.normalize("NFKC").toLowerCase();
  // Authored case checks, not a general language evaluator. Ignore simple negated instructions.
  const instructions = text.replace(/\b(?:do not|don't|never|without|no)\s+(?:include\s+|provide\s+|use\s+|mention\s+)?(?:a\s+|an\s+|the\s+)?(?:offline|print(?:ed)?|paper|east|opening|briefing|ramp)[^.!;\n]*/g, "");
  const times = [...new Set([...instructions.matchAll(/\b(?:18|6)[:.]([03]0)\b/g)].map((match) => match[1] === "30" ? "18:30" : "18:00"))];
  const time = times.length > 1 ? "conflict" : times[0] ?? null;
  return {
    time,
    task: /brief|instruct|guide|checklist/i.test(instructions),
    entrance: /east/i.test(instructions),
    offline: /offline|print|paper/i.test(instructions),
    opening: time !== null || /opening|confirmed time/i.test(instructions),
    access: /ramp|step[- ]?free|wheelchair|accessib/i.test(instructions),
  };
}

export function reviewPrompt(prompt: string) {
  const text = prompt.normalize("NFKC").toLowerCase();
  const risks: string[] = [];
  if (/\b(?:noor|patel|ivo|rae)\b/i.test(text)) risks.push("Volunteer names are unnecessary for a general briefing. Use roles or access requirements.");
  if (/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(text)) risks.push("The email address would be shared. Ask for a general briefing and address it through the station’s own process.");
  if (/(?<!\d)(?:\d[ ()+.-]*){7,}(?!\d)/.test(text)) risks.push("Contact numbers are private planning details. Remove them from the request.");
  if (/multiple sclerosis/i.test(text)) risks.push("The diagnosis would be shared. State the step-free access requirement without the medical background.");
  const context = promptContext(prompt);
  const missing: string[] = [];
  if (!context.task) missing.push("Ask for a briefing or instructions.");
  if (!context.entrance) missing.push("Keep the confirmed east entrance.");
  if (!context.offline) missing.push("Include a printable or offline version.");
  if (!context.opening) missing.push("Ask for the confirmed opening time.");
  if (context.time === "18:00") missing.push("The request specifies 18:00, but tonight’s booking says 18:30. Correct the time before sending.");
  if (context.time === "conflict") missing.push("The request contains conflicting opening times. Choose the confirmed time before sending.");
  if (!context.access) missing.push("Keep the step-free access requirement without the diagnosis.");
  return { risks, missing, safe: risks.length === 0, useful: missing.length === 0 };
}

export function briefingResponse(prompt: string, bulletin: Bulletin): Briefing {
  const context = promptContext(prompt);
  const lines: string[] = [];
  if (context.task) lines.push("Volunteer briefing for the repair café.");
  const time = context.time ?? bulletin.time;
  if (context.opening) lines.push(time === "conflict" ? "The request contains conflicting opening times. Confirm before distributing."
    : bulletin.day === "unconfirmed" || time === "unconfirmed" ? "Opening details still need confirmation from the editor."
    : `${bulletin.day}, ${time} — ${context.time ? "time supplied in your request" : "from your edited announcement"}.`);
  if (context.entrance) lines.push(bulletin.entrance === "unconfirmed" ? "The visitor entrance still needs confirmation."
    : `Direct visitors to ${bulletin.entrance === "east" ? "the east entrance" : "the front doors"}, as supplied in the edited announcement.`);
  if (context.offline) lines.push("Print a paper copy of these instructions for volunteers who cannot download them.");
  if (context.access) lines.push("Keep the step-free ramp clear and station a greeter there.");
  const gaps = [
    context.time === "18:00" && "The request used 18:00, which conflicts with tonight’s booking.",
    context.time === "conflict" && "Conflicting times in the request leave the response unfit to distribute.",
    !context.opening && "No opening time requested: the response gives volunteers no arrival time.",
    !context.entrance && "No entrance requested: the response gives volunteers no route into the hall.",
    !context.offline && "No offline copy requested: Ivo cannot rely on downloading these instructions.",
    !context.access && "No access requirement included: the response leaves the ramp out of the plan.",
  ].filter((item): item is string => Boolean(item));
  const shared = [...new Set(prompt.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b(?:Noor(?: Patel)?|Ivo|Rae)\b|(?<!\d)\d{3}[- .]\d{4}(?!\d)|multiple sclerosis/gi) ?? [])];
  return { lines: lines.length ? lines : ["A general welcome to the volunteer team."], gaps, shared, basis: { day: bulletin.day, time: bulletin.time, entrance: bulletin.entrance } };
}

export function briefingCurrent(state: Pick<GameState, "sentPrompt" | "sentBriefing" | "bulletin">): boolean {
  const basis = state.sentBriefing?.basis;
  return state.sentPrompt !== null && Boolean(basis && basis.day === state.bulletin.day && basis.time === state.bulletin.time && basis.entrance === state.bulletin.entrance);
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
  const claims = state.claimReviews ? assessClaims(state.claimReviews) : null;
  const day = state.bulletin.day === "Saturday";
  const time = state.bulletin.time === "18:30";
  const entrance = state.bulletin.entrance === "east";
  const evidence = claims ? claims.every((claim) => claim.source && claim.reason) : state.bulletin.source === "booking";
  const coverage = planCoverage(state);
  const access = planCost(state.repairs) <= 3 && coverage.every((person) => person.works);
  const privacy = !state.leaked && state.sentUseful && briefingCurrent(state);
  const ending: EndingId = day && time && entrance && access
    ? privacy && evidence ? "clear-signal" : "last-minute-save"
    : "crossed-wires";
  return { day, time, entrance, evidence, claims, coverage, access, privacy, ending };
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
      ["18:00", "18:30", "unconfirmed"].includes(state.bulletin?.time) &&
      ["front", "east", "unconfirmed"].includes(state.bulletin?.entrance) &&
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
      state.bulletin.day ??= "Saturday";
      if (!["Saturday", "Friday", "unconfirmed"].includes(state.bulletin.day)) return null;
      if (!("claimReviews" in state)) {
        // Completed older shifts retain their report. Active shifts revisit only the new review step.
        const migrated = state as GameState;
        migrated.claimReviews = migrated.published ? null : emptyClaimReviews();
        if (!migrated.published) {
          const old = { ...migrated.bulletin };
          updateClaimReview(migrated, "day", { decision: old.day === "Saturday" ? "keep" : old.day === "Friday" ? "correct" : "hold", source: old.source as ClaimReview["source"] });
          updateClaimReview(migrated, "time", { decision: old.time === "18:30" ? "correct" : old.time === "18:00" ? "keep" : "hold", source: old.source as ClaimReview["source"] });
          updateClaimReview(migrated, "entrance", { decision: old.entrance === "east" ? "correct" : old.entrance === "front" ? "keep" : "hold", source: old.source as ClaimReview["source"] });
          migrated.tutorials = migrated.tutorials.filter((tab) => tab !== "bulletin");
        }
      }
      if (state.claimReviews === null) {
        if (!state.published) return null;
      } else {
        if (typeof state.claimReviews !== "object" || Array.isArray(state.claimReviews)) return null;
        if (!announcementClaims.every(({ id }) => {
          const review = state.claimReviews?.[id];
          return review && ["", "keep", "correct", "hold"].includes(review.decision) &&
            ["", "booking", "poster", "draft"].includes(review.source) && ["", ...claimReasons.map((reason) => reason.id)].includes(review.reason);
        })) return null;
        // The reviewed claims are authoritative; stale preview fields cannot change the outcome.
        const filed = state.bulletinFiled;
        updateClaimReview(state, "day", {});
        state.bulletinFiled = filed && claimsComplete(state.claimReviews);
      }
      state.sentBriefing ??= state.sentPrompt === null ? null : briefingResponse(state.sentPrompt, state.bulletin);
      if (state.sentBriefing !== null) {
        const snapshot = state.sentBriefing;
        if (!snapshot || ![snapshot.lines, snapshot.gaps, snapshot.shared].every((items) => Array.isArray(items) && items.length <= 20 && items.every((item) => typeof item === "string" && item.length <= 2000)) ||
          !snapshot.lines.length || !snapshot.basis ||
          !["Saturday", "Friday", "unconfirmed"].includes(snapshot.basis.day) || !["18:00", "18:30", "unconfirmed"].includes(snapshot.basis.time) || !["front", "east", "unconfirmed"].includes(snapshot.basis.entrance) || state.sentPrompt === null) return null;
      } else if (state.sentPrompt !== null) return null;
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
    state.bulletinFiled && briefingCurrent(state) && state.planReviewed;
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
    if (!briefingCurrent(state)) return {
      title: "Update the sent briefing",
      instruction: "The announcement changed after the request was sent. Send a revised briefing with the updated details.",
      action: "task:prompt", label: "Update AI request", target: "desk", checks: [],
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
    instruction: "Review each AI claim: keep, correct, or withhold it, then attach evidence and a reason.",
    action: "task:bulletin", label: "Edit bulletin", target: "desk", checks: [],
  };
  if (!briefingCurrent(state)) return {
    title: "Prepare a briefing request",
    instruction: state.sentPrompt === null ? "Mara copied private notes into an AI request. Rewrite it before sending." : "The announcement changed. Send a revised briefing so the crew gets the updated details.",
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
