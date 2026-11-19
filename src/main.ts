import "./style.css";
import {
  scenes, documents, people, conversations, promptOriginal, promptExample,
  arrangements, endings, references,
  type SceneId, type DocumentId, type PersonId, type EndingId, type Dialogue,
} from "./content";
import {
  newGame, reviewPrompt, planCoverage, planCost, assess, readSave, readLibrary,
  saveKey, libraryKey, currentObjective, investigationComplete, taskAvailable,
  readyForBroadcast, type DeskTab, type GameState,
} from "./engine";
import { sprite } from "./sprites";

const main = document.querySelector<HTMLElement>("main")!;
const esc = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;").replaceAll('"', "&quot;");
function getStored(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
let state: GameState | null = readSave(getStored(saveKey));
let library = readLibrary(getStored(libraryKey));
let screen: "title" | "world" | "report" | "sources" = "title";
let modal: string | null = null;
let dialogue: Dialogue | null = null;
let line = 0;
let afterDialogue: (() => void) | null = null;
let typing: ReturnType<typeof setInterval> | undefined;
let fullLine = "";
let busy = false;
let walkTimer: ReturnType<typeof setTimeout> | undefined;
let saveFailed = false;
let notice = "";
let promptChecked = false;
let planChecked = false;
let selectedDocument: DocumentId | null = null;
let documentReturn: string | null = null;
let workTab: DeskTab = "bulletin";
let position = { x: 49, y: 81 };
const playerImage = sprite("#d8ae66");
const portraits = Object.fromEntries(Object.entries(people).map(([id, person]) => [id, sprite(person.color, false, id as PersonId)]));
const sceneHotspots: Record<SceneId, { label: string; action: string; x: number; y: number; person?: PersonId }[]> = {
  studio: [
    { label: "Talk to Ada", action: "talk:ada", x: 25, y: 68, person: "ada" },
    { label: "Open the broadcast desk", action: "desk", x: 54.5, y: 46 },
  ],
  archive: [
    { label: "Read tonight’s booking", action: "document:booking", x: 24, y: 45 },
    { label: "Inspect the old poster", action: "document:poster", x: 56, y: 32 },
  ],
  courtyard: [
    { label: "Talk to Mara", action: "talk:mara", x: 30, y: 67, person: "mara" },
    { label: "Talk to Ivo", action: "talk:ivo", x: 72, y: 65, person: "ivo" },
    { label: "Read private volunteer notes", action: "document:roster", x: 40, y: 45 },
  ],
};

function persist() {
  try {
    const savedLibrary = readLibrary(getStored(libraryKey));
    library.endings = [...new Set([...savedLibrary.endings, ...library.endings])];
    library.runs = Math.max(library.runs, savedLibrary.runs);
    localStorage.setItem(saveKey, JSON.stringify(state));
    localStorage.setItem(libraryKey, JSON.stringify(library));
    saveFailed = false;
  } catch { saveFailed = true; }
}
function btn(label: string, action: string, secondary = false) {
  return `<button data-action="${action}" class="${secondary ? "secondary" : ""}">${label}</button>`;
}
function updateHeader() {
  document.getElementById("save-status")!.textContent = saveFailed ? "Save unavailable" : state ? "Progress saved on this device" : "A short story about AI";
}
function render() {
  const previousPanel = main.querySelector<HTMLElement>('[role="dialog"]');
  const previousScroll = previousPanel?.scrollTop ?? 0;
  const previousAction = (document.activeElement as HTMLElement | null)?.dataset.action;
  const preservePosition = previousPanel?.dataset.modal === modal &&
    previousPanel?.dataset.task === workTab;
  clearInterval(typing);
  updateHeader();
  document.body.dataset.screen = screen;
  if (screen === "title") main.innerHTML = title();
  if (screen === "world") main.innerHTML = world();
  if (screen === "report") main.innerHTML = report();
  if (screen === "sources") main.innerHTML = sourcePage();
  if (modal) {
    main.insertAdjacentHTML("beforeend", `<div class="modal-shade"><section role="dialog" aria-modal="true" aria-labelledby="modal-title" class="dialog-panel" data-modal="${modal}" data-task="${workTab}">${modalContent()}</section></div>`);
    for (const child of Array.from(main.children)) {
      if (!child.classList.contains("modal-shade") && child instanceof HTMLElement) {
        child.inert = true;
        child.setAttribute("aria-hidden", "true");
      }
    }
    queueMicrotask(() => {
      const panel = main.querySelector<HTMLElement>('[role="dialog"]')!;
      const previousControl = preservePosition && previousAction
        ? panel.querySelector<HTMLElement>(`[data-action="${previousAction}"]`) : null;
      (previousControl ?? panel.querySelector<HTMLElement>("button, select, textarea"))?.focus({ preventScroll: true });
      if (preservePosition) panel.scrollTop = previousScroll;
    });
  }
  for (const element of Array.from(document.querySelectorAll<HTMLElement>("header, footer"))) {
    element.inert = Boolean(modal);
    element.setAttribute("aria-hidden", String(Boolean(modal)));
  }
  if (dialogue && modal === "dialogue") startType();
}
function title() {
  return `<section class="main-menu">
    <div class="menu-backdrop atlas exterior" role="img" aria-label="A coastal radio station at dusk in the rain"></div>
    <div class="menu-shade"></div>
    <div class="menu-content">
      <p class="menu-credit">AI Arcade</p>
      <h1>LAST LIGHT<br><span>RADIO</span></h1>
      <p class="menu-premise">Check the draft. Prepare the crew.<br>Decide what goes on air.</p>
      <div class="menu-actions">${state ? btn(state.published ? "View your ending" : "Continue your shift", "continue") : btn("Start your shift", "new")}
        ${state ? btn("New shift", "new", true) : ""}
        ${btn("How to play", "help", true)}
        ${btn("Endings · " + library.endings.length + " / 3", "collection", true)}
        ${btn("Sources", "sources", true)}
      </div>
      <p class="menu-save">Untimed · Progress saves on this device</p>
    </div>
    <div class="menu-controls" aria-label="Basic controls">
      <p><strong>Explore</strong> Click people, objects, and exits.</p>
      <p><strong>Talk</strong> Click the dialogue to reveal or advance it.</p>
      <p><strong>Prepare</strong> Follow your objective. Use the desk to make decisions.</p>
    </div>
  </section>`;
}
function collectionContent() {
  return `<div class="modal-heading"><h2 id="modal-title">Your endings · ${library.endings.length} / 3</h2>${btn("Close", "close", true)}</div>
    <div class="ending-grid">${Object.entries(endings).map(([id, ending]) => `<article class="ending-card ${library.endings.includes(id as EndingId) ? "unlocked" : ""}"><h3>${library.endings.includes(id as EndingId) ? ending.title : "Undiscovered ending"}</h3><p>${library.endings.includes(id as EndingId) ? ending.summary : "Finish a shift to discover how your decisions play out."}</p></article>`).join("")}</div>`;
}
function objectivePanel() {
  const goal = currentObjective(state!);
  return `<section class="objective-panel" aria-label="Current objective">
    <h2 id="objective-title">${goal.title}</h2><p>${goal.instruction}</p>
    ${goal.checks.length ? `<ul class="objective-checks">${goal.checks.map((check) => `<li class="${check.done ? "done" : ""}"><span aria-hidden="true">${check.done ? "✓" : "○"}</span> ${check.label}${check.done ? '<span class="sr-only"> complete</span>' : ""}</li>`).join("")}</ul>` : ""}
  </section>`;
}
function world() {
  const current = state!;
  const room = scenes[current.scene];
  return `<section class="world-shell" aria-label="Last Light Radio">
    <div class="game-hud">${objectivePanel()}
      <div class="toolbar">${btn("Notebook · " + current.evidence.length, "notebook", true)}${btn("Station map", "map", true)}${btn("Menu", "pause", true)}</div>
    </div>
    <div class="scene atlas ${current.scene}" id="scene" role="region" aria-label="${room.name}. ${room.description}">
      <div class="scene-location"><strong>${room.name}</strong></div>
      ${current.scene === "courtyard" ? '<div class="rain" aria-hidden="true"></div>' : '<div class="lamp-glow" aria-hidden="true"></div>'}
      ${sceneHotspots[current.scene].map((spot) => `<button class="hotspot ${spot.person ? "person" : "object"} ${currentObjective(current).target === spot.action ? "objective-target" : ""}" data-action="${spot.action}" data-x="${spot.x}" data-y="${Math.max(65, spot.y)}" style="left:${spot.x}%;top:${spot.y}%;--depth:${0.88 + (spot.y - 64) * 0.009};z-index:${spot.person ? Math.round(spot.y) : 90}" aria-label="${spot.label}">${spot.person ? `<img src="${portraits[spot.person]}" alt="" draggable="false"><span>${people[spot.person].name}</span>` : '<span class="inspect-dot" aria-hidden="true">◆</span>'}<span class="hotspot-label">${spot.label}</span></button>`).join("")}
      <div id="player" class="player" style="left:${position.x}%;top:${position.y}%;--depth:${0.88 + (position.y - 64) * 0.009};z-index:${Math.round(position.y)}" role="img" aria-label="Your character"><img src="${playerImage}" alt=""></div>
      <div class="scene-exits">${room.exits.map((exit) => btn(scenes[exit].name + " →", "travel:" + exit, true)).join("")}</div>
    </div>
    ${saveFailed ? '<p class="save-error" role="status">This browser could not save progress. Keep this tab open.</p>' : ""}
  </section>`;
}
function sourcePage() {
  return `<section class="reading-page"><h1>Sources &amp; notes</h1><p>The station, people, notices, and event are fictional. The puzzles practise checking AI output, limiting private information, and considering who a recommendation leaves out.</p>
  ${references.map((ref) => `<article><h2>${ref.title}</h2><p>${ref.publisher} · ${ref.note}</p><a href="${ref.url}" target="_blank" rel="noopener noreferrer">Read source ↗</a></article>`).join("")}
  <p class="small">The station assistant is simulated. Prompt feedback checks patterns written for this case and may miss unusual wording. New endings and adventure progress save in this browser’s local storage.</p>
  ${btn("Back to the station", "back", true)}</section>`;
}
function notebookContent() {
  return `<div class="modal-heading"><div><h2 id="modal-title">Messages &amp; discoveries</h2></div>${btn("Close", "close", true)}</div>
    <div class="notebook-list">${Object.entries(documents).filter(([id]) => state!.evidence.includes(id as DocumentId)).map(([id, doc]) => `<button data-action="document:${id}"><span>${esc(doc.source)}</span><strong>${doc.title}</strong></button>`).join("") || "<p>Inspect a document to add it here.</p>"}</div>
    <h3>People you’ve spoken to</h3><p>${state!.met.map((id) => people[id].name).join(" · ") || "No one yet."}</p>`;
}
const taskGuides: Record<DeskTab, { title: string; purpose: string; steps: string[] }> = {
  bulletin: {
    title: "Check the public bulletin",
    purpose: "Check the time and entrance against the original messages.",
    steps: [
      "Read the original messages. You can reopen them in your notebook.",
      "Choose a time, an entrance, and the source supporting your decision.",
      "Save your choice. You can revise it before broadcasting; the ending reveals the consequences.",
    ],
  },
  prompt: {
    title: "Write a useful, private request",
    purpose: "Rewrite the copied prompt into a useful briefing request without private details.",
    steps: [
      "Edit Your request. Keep practical requirements; remove identifying details.",
      "Review request checks your draft without sending it. You can review repeatedly.",
      "Send request commits what you share. A revision cannot undo an earlier disclosure.",
    ],
  },
  plan: {
    title: "Choose workable arrangements",
    purpose: "Spend up to three crew points on arrangements for the volunteers.",
    steps: [
      "Select arrangements within the three-point budget. Select again to remove.",
      "Preview the plan to see who it reaches. Adjust and preview as needed.",
      "Check in with Ada when ready. If conditions change, recheck your plan before broadcasting.",
    ],
  },
};
function taskDone(tab: DeskTab) {
  if (tab === "bulletin") return state!.bulletinFiled;
  if (tab === "prompt") return state!.sentPrompt !== null;
  return state!.late ? state!.latePlanReviewed : state!.planReviewed;
}
function openTask(tab: DeskTab) {
  workTab = tab;
  if (!state!.evidence.includes("draft")) state!.evidence.push("draft");
  modal = taskAvailable(state!, tab) && !state!.tutorials.includes(tab) ? "tutorial" : "desk";
  persist();
  render();
}
function taskTutorial() {
  const guide = taskGuides[workTab];
  return `<h2 id="modal-title">${guide.title}</h2>
    <p>${guide.purpose}</p><ol class="help-list">${guide.steps.map((step) => `<li>${step}</li>`).join("")}</ol>
    <div class="actions">${btn("Open task", "begin-task")}${btn("Back to the room", "close", true)}</div>`;
}
function deskContent() {
  const current = state!;
  const goal = currentObjective(current);
  const available = taskAvailable(current, workTab);
  return `<div class="modal-heading"><div><h2 id="modal-title">${available ? taskGuides[workTab].title : "Broadcast desk"}</h2></div>${btn("Close", "close", true)}</div>
  <div class="desk-tabs" role="tablist" aria-label="Desk tasks">${([["bulletin", "The bulletin"], ["prompt", "AI request"], ["plan", "Arrangements"]] as [DeskTab, string][]).map(([tab, name]) => `<button role="tab" aria-selected="${workTab === tab}" data-locked="${!taskAvailable(current, tab)}" data-action="tab:${tab}">${name}<span class="tab-status" aria-hidden="true">${taskDone(tab) ? "Done" : taskAvailable(current, tab) ? "" : "Later"}</span></button>`).join("")}</div>
  ${available ? `<div class="task-help">${btn("How this works", "task-help", true)}</div>` : ""}
  ${notice ? `<p class="task-notice" role="status">${notice}</p>` : ""}
  <div class="desk-content">${available
    ? workTab === "bulletin" ? bulletinTab() : workTab === "prompt" ? promptTab() : planTab()
    : `<div class="task-locked"><h3>${goal.title}</h3><p>${goal.instruction}</p></div>`}</div>
  <div class="desk-footer">${goal.action.startsWith("travel:") ? btn("Back to the room", "close", true) : btn(goal.label, goal.action)}</div>`;
}
function bulletinTab() {
  const current = state!;
  if (!investigationComplete(current)) return `<div class="task-columns"><section><h3>The assistant’s starting draft</h3><blockquote>${esc(documents.draft.body)}</blockquote></section>
    <section class="output-paper"><h3>Check the originals first</h3><p>The booking message and an older poster are in the equipment room. Which one applies tonight?</p></section></div>`;
  return `<div class="task-columns"><section><h3>The assistant’s starting draft</h3><blockquote>${esc(documents.draft.body)}</blockquote>
    <h3>Original sources</h3><div class="source-buttons">${current.evidence.filter((id) => id !== "roster").map((id) => btn(documents[id].title, "document:" + id, true)).join("")}</div>
</section>
    <section class="output-paper"><h3>Your public bulletin</h3>
      <label for="opening-time">Opening time</label><select id="opening-time" data-field="time"><option value="18:00" ${current.bulletin.time === "18:00" ? "selected" : ""}>Saturday, 18:00</option><option value="18:30" ${current.bulletin.time === "18:30" ? "selected" : ""}>Saturday, 18:30</option></select>
      <label for="entrance">Tell visitors to use</label><select id="entrance" data-field="entrance"><option value="front" ${current.bulletin.entrance === "front" ? "selected" : ""}>The front doors</option><option value="east" ${current.bulletin.entrance === "east" ? "selected" : ""}>The east entrance</option></select>
      <label for="source">Evidence behind your corrections</label><select id="source" data-field="source"><option value="">Choose a source</option>${current.evidence.filter((id) => ["booking", "poster", "draft"].includes(id)).map((id) => `<option value="${id}" ${current.bulletin.source === id ? "selected" : ""}>${documents[id].title}</option>`).join("")}</select>
      <div class="bulletin-preview" id="bulletin-preview">${bulletinPreview()}</div><div class="actions">${btn(current.bulletinFiled ? "Save changes" : "Save bulletin", "save-bulletin")}</div></section></div>`;
}
function bulletinPreview() {
  return `“The repair café opens Saturday at ${state!.bulletin.time}. Use ${state!.bulletin.entrance === "east" ? "the east entrance" : "the front doors"}.”`;
}
function promptTab() {
  const current = state!;
  const check = reviewPrompt(current.draft);
  return `<div class="task-columns"><section><h3>Copied planning prompt</h3><blockquote>${esc(promptOriginal)}</blockquote>
    <label for="prompt">Your request to the station assistant</label><textarea id="prompt" maxlength="1600" spellcheck="false">${esc(current.draft)}</textarea>

    <div class="actions">${btn("Review request", "review-prompt", true)}${btn(current.sentPrompt === null ? "Send request" : "Send a revised request", "send-prompt")}</div></section>
    <section class="output-paper" id="prompt-feedback" tabindex="-1"><h3>${promptChecked ? "Before you send" : "Assistant preview"}</h3>
      ${promptChecked ? `<h4>Information check</h4>${check.risks.length ? `<ul>${check.risks.map((risk) => `<li>${risk}</li>`).join("")}</ul>` : "<p>No known private details from this case remain.</p>"}<h4>Task check</h4>${check.missing.length ? `<ul>${check.missing.map((missing) => `<li>${missing}</li>`).join("")}</ul>` : "<p>The useful briefing requirements are present.</p>"}` : "<p>Review your request to see which information you would send and which practical instructions remain.</p>"}
      ${current.sentPrompt !== null ? `<h4>The assistant returns</h4><p>${current.sentUseful ? "Volunteer briefing: confirm the opening time against the hall booking, use the east entrance, and provide a printed version. Keep the step-free route clear." : "Volunteer briefing: welcome the team, assign their roles, and share the schedule. Some practical instructions were missing from the request."}</p><p class="small">${current.leaked ? "Private details were included in a sent request. A revision improves future output but cannot undo that disclosure." : "The sent request kept this case’s known private details out."}</p>` : ""}
      <details><summary>Need a starting point?</summary><p>${esc(promptExample)}</p></details>
    </section></div>`;
}
function planTab() {
  const current = state!;
  return `<p>The assistant proposed a video briefing for everyone. It had no information about data limits or transport. You have <strong>3 crew points</strong> to put workable arrangements in place.</p>
    ${current.late ? '<p class="late-notice">New information · The harbour bus is cancelled. The inland road is still open.</p>' : ""}
    <div class="task-columns"><section><h3>Choose arrangements <span class="cost">${planCost(current.repairs)}/3</span></h3>
      <div class="repair-options">${arrangements.map((item) => `<button aria-pressed="${current.repairs.includes(item.id)}" data-action="repair:${item.id}"><strong>${item.name}<span>${item.cost} ${item.cost === 1 ? "point" : "points"}</span></strong><span>${item.description}</span></button>`).join("")}</div>
      <div class="actions">${btn("Preview the plan", "preview-plan", true)}</div></section>
    <section class="output-paper" id="plan-feedback" tabindex="-1"><h3>People relying on the plan</h3>
      ${planCoverage(current).map((person) => `<article class="participant"><strong>${person.name}</strong><p>${person.reason}</p>${planChecked ? `<p class="plan-result ${person.works ? "good" : ""}">${person.works ? "A workable option is in place." : "Still faces a barrier."}</p>` : ""}</article>`).join("")}
      ${planChecked ? '<p class="small">This preview uses the information you currently have. Recheck the plan if conditions change.</p>' : ""}</section></div>`;
}
function modalContent(): string {
  if (modal === "dialogue") return `<div class="speech-head"><h2 id="modal-title">${dialogue!.speaker}</h2><span>${line + 1}/${dialogue!.lines.length}</span></div>
    <button class="speech-control" data-action="next-line" aria-label="Reveal or advance dialogue" aria-describedby="dialogue-full"><span class="sr-only" id="dialogue-full">${esc(dialogue!.lines[line])}</span><span class="speech" id="speech" aria-hidden="true"></span><span class="speech-cue"><span>Click or press Enter</span><span aria-hidden="true">▾</span></span></button>`;
  if (modal === "pause") return `<h2 id="modal-title">Last Light Radio</h2><p class="pause-status">${saveFailed ? "Saving unavailable" : "Progress saved on this device"}</p><div class="pause-actions">${btn("Resume", "close")}${btn("How to play", "help", true)}${btn("Main menu", "title", true)}${btn("Sources", "sources", true)}</div>`;
  if (modal === "tutorial") return taskTutorial();
  if (modal === "collection") return collectionContent();
  if (modal === "help") return `<h2 id="modal-title">How to play</h2>
    <p>You’re checking a radio bulletin prepared with AI. People will follow what you broadcast.</p>
    <ol class="help-list"><li><strong>Follow the current objective.</strong> It stays in the corner of the game. Explore the room to find what you need.</li><li><strong>Explore the station.</strong> Click diamond markers, people, and room exits. Documents stay in your notebook.</li><li><strong>Prepare at the desk.</strong> The bulletin, AI request, and arrangements open in order. Each task has a short introduction and a How this works button.</li><li><strong>Recheck, then broadcast.</strong> Ada brings a late message. Respond to it before you go on air. The ending explains the consequences of your decisions.</li></ol>
    <p class="small">Click dialogue to reveal the line, then click again to advance. Tab and Enter also work. The game is untimed and saves your progress here.</p>${btn("Back", "close")}`;
  if (modal === "new") return `<h2 id="modal-title">Start a new shift?</h2><p>This replaces the current adventure save. Your discovered endings stay in the collection.</p><div class="actions">${btn("Start new shift", "confirm-new")}${btn("Keep current shift", "close", true)}</div>`;
  if (modal === "notebook") return notebookContent();
  if (modal === "map") return `<div class="modal-heading"><h2 id="modal-title">The station</h2>${btn("Close", "close", true)}</div><p>Choose a room.</p><div class="map-rooms">${Object.entries(scenes).map(([id, room]) => `<button data-action="travel:${id}"><span class="map-preview atlas ${id}"></span><strong>${room.name}</strong><span>${room.description}</span></button>`).join("")}</div>`;
  if (modal === "document") {
    const doc = documents[selectedDocument!];
    return `<div class="modal-heading"><div><h2 id="modal-title">${doc.title}</h2><p class="document-source">${esc(doc.source)}</p></div>${btn("Close", "close", true)}</div><div class="document-body">${esc(doc.body)}</div>${selectedDocument === "draft" ? '<p>What source would you check before relying on this?</p>' : ""}${btn("Return", "close")}`;
  }
  if (modal === "desk") return deskContent();
  if (modal === "send") return `<h2 id="modal-title">Send this request?</h2><p>The assistant will receive the text below. You can revise it first.</p><blockquote>${esc(state!.draft)}</blockquote><p class="small">This is a story action. The prototype processes the request on your device.</p><div class="actions">${btn("Send to assistant", "confirm-send")}${btn("Keep editing", "cancel-send", true)}</div>`;
  if (modal === "launch") return `<h2 id="modal-title">You’re about to go on air</h2><div class="bulletin-preview">${bulletinPreview()}</div><p>${planCost(state!.repairs)} crew points assigned. The bulletin and arrangements become final when you broadcast.</p><div class="actions">${btn("Broadcast", "confirm-launch")}${btn("Keep preparing", "cancel-launch", true)}</div>`;
  return "";
}
function report() {
  const current = state!;
  const result = assess(current);
  const ending = endings[current.ending!];
  const checks = [
    { title: "Opening time", passed: result.time, why: result.time ? "Visitors hear 18:30, after the market clears the hall." : "The 18:00 announcement sends visitors before the hall is ready. Check tonight’s booking, not the reused flyer." },
    { title: "Evening entrance", passed: result.entrance, why: result.entrance ? "Visitors use the east entrance after the front doors lock." : "The front doors lock at 18:00. The current booking gives the east entrance for evening visitors." },
    { title: "Evidence behind the bulletin", passed: result.evidence, why: result.evidence ? "You grounded the changes in the current booking confirmation." : "The source you chose doesn’t establish tonight’s arrangements. Trace the assistant’s summary to the current booking." },
    { title: "Information handling", passed: result.privacy, why: current.leaked ? "A sent request included known private details. Generalize names, contact information, and diagnoses before sending. A later revision can improve the draft, but does not retract an earlier disclosure." : current.sentUseful ? "Your request preserved useful access and offline requirements without the known private details." : "The request kept some task requirements out. Privacy also needs a useful replacement: keep the entrance, opening time, and offline instructions." },
    { title: "A plan people can use", passed: result.access, why: result.access ? "The inland pickup carries people and briefing sheets. The staffed east ramp gives Rae a usable entrance." : result.coverage.filter((person) => !person.works).map((person) => person.reason).join(" ") },
  ];
  return `<section class="ending-scene"><div class="ending-image atlas exterior"></div><div class="ending-copy"><h1>${ending.title}</h1><p>${ending.scene}</p><p class="ending-summary">${ending.summary}</p></div></section>
    <section class="report-card"><div class="report-heading"><div><h2>Your shift report</h2></div><span class="report-score">${checks.filter((item) => item.passed).length}<small>/ 5</small></span></div>
    ${checks.map((item) => `<article><span class="check-mark ${item.passed ? "pass" : ""}" aria-hidden="true">${item.passed ? "✓" : "!"}</span><div><h3>${item.title} · ${item.passed ? "Handled" : "Revisit"}</h3><p>${item.why}</p></div></article>`).join("")}
    <details><summary>What changed when the message arrived?</summary><p>The bus cancellation left the opening time intact but changed travel. A shared inland pickup with paper briefings costs two points. Clearing the east ramp uses the third. A bus greeter and a video link could not replace that.</p></details>
    <p class="small">You found ${current.evidence.length} of ${Object.keys(documents).length} documents and spoke to ${current.met.length} of 3 people. Ending saved to your collection. Replaying can reveal other outcomes.</p><div class="actions">${btn("Play another shift", "new")}${btn("View ending collection", "title", true)}</div>
    ${saveFailed ? '<p class="save-error">This browser could not save the ending. Keep this page open to read the report.</p>' : ""}</section>`;
}
function openDialogue(conversation: Dialogue, done?: () => void) {
  dialogue = conversation;
  line = 0;
  afterDialogue = done ?? null;
  modal = "dialogue";
  render();
}
function startType() {
  const target = document.getElementById("speech")!;
  fullLine = dialogue!.lines[line];
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    target.textContent = fullLine;
    return;
  }
  let count = 0;
  typing = setInterval(() => {
    count += 3;
    target.textContent = fullLine.slice(0, count);
    if (count >= fullLine.length) clearInterval(typing);
  }, 18);
}
function showText() {
  clearInterval(typing);
  const target = document.getElementById("speech");
  if (target) target.textContent = fullLine;
}
function walkTo(x: number, y: number, done: () => void) {
  if (busy) return;
  busy = true;
  const actor = document.getElementById("player")!;
  position = { x, y };
  actor.style.left = x + "%";
  actor.style.top = y + "%";
  actor.style.setProperty("--depth", String(0.88 + (y - 64) * 0.009));
  actor.style.zIndex = String(Math.round(y));
  actor.classList.add("walking");
  const frames = actor.querySelector("img")!;
  frames.src = sprite("#d8ae66", true);
  walkTimer = setTimeout(() => {
    busy = false;
    actor.classList.remove("walking");
    frames.src = playerImage;
    done();
  }, matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 420);
}
function handle(action: string) {
  if (action === "pause") { modal = "pause"; render(); return; }
  if (action === "collection") { modal = "collection"; render(); return; }
  if (action === "help") { modal = "help"; render(); return; }
  if (action === "title") { screen = "title"; modal = null; dialogue = null; render(); return; }
  if (action === "sources") { screen = "sources"; modal = null; render(); return; }
  if (action === "back") { screen = state ? state.published ? "report" : "world" : "title"; render(); return; }
  if (action === "new") {
    if (state) { modal = "new"; render(); } else handle("confirm-new");
    return;
  }
  if (action === "confirm-new") {
    state = newGame(promptOriginal);
    modal = null; screen = "world"; position = { x: 49, y: 81 };
    promptChecked = false; planChecked = false; notice = "";
    persist();
    openDialogue({ speaker: "Ada", lines: [
      "You’re on the evening desk. The repair café needs its announcement checked before we broadcast. The station assistant prepared a draft, and people will follow the details we put on air.",
      "First, open the broadcast desk and read that draft. Your objective stays in the corner. Explore the station to find what you need.",
    ] });
    return;
  }
  if (action === "continue") { screen = state!.published ? "report" : "world"; modal = null; render(); return; }
  if (action === "close") {
    modal = modal === "document" ? documentReturn : null;
    documentReturn = null; selectedDocument = null; dialogue = null; notice = "";
    render();
    if (!modal) main.focus();
    return;
  }
  if (action === "next-line") {
    if (document.getElementById("speech")?.textContent !== fullLine) { showText(); return; }
    if (line < dialogue!.lines.length - 1) { line++; render(); }
    else {
      const done = afterDialogue;
      dialogue = null; afterDialogue = null; modal = null;
      done?.(); persist(); render();
    }
    return;
  }
  if (!state || state.published) return;
  const [kind, id] = action.split(":");
  if (kind === "travel") {
    state.scene = id as SceneId; position = { x: 49, y: 81 }; modal = null; persist(); render(); return;
  }
  if (kind === "talk") {
    const person = id as PersonId;
    let conversation = conversations[person];
    if (person === "mara" && state.leaked) conversation = {
      speaker: "Mara",
      lines: [
        "Ada showed me the request. Those personal details were meant for our restricted sheet. Removing them from a later draft doesn’t pull back the first request.",
        "We can still give the team a useful briefing. Ask for the practical requirements without names or medical background. I’ll handle the follow-up with the station.",
      ],
    };
    else if (person === "ivo" && state.late) conversation = {
      speaker: "Ivo",
      lines: state.repairs.includes("shuttle") ? [
        "The driver’s taking the inland road and bringing the printed sheets. That gets Noor and me there with the tools.",
        "Make sure someone clears the east ramp. Getting us there is only half the plan.",
      ] : [
        "The bus won’t come. Noor is still waiting, and I still need a briefing I can read offline.",
        "The station driver can take the inland road and carry the sheets. If you arrange that, we can travel with the tools.",
      ],
    };
    openDialogue(conversation, () => {
      if (!state!.met.includes(person)) state!.met.push(person);
    });
    return;
  }
  if (kind === "document") {
    documentReturn = modal === "desk" || modal === "notebook" ? modal : null;
    selectedDocument = id as DocumentId;
    if (!state.evidence.includes(selectedDocument)) state.evidence.push(selectedDocument);
    modal = "document"; persist(); render(); return;
  }
  if (action === "desk") {
    const recommended = currentObjective(state).action;
    openTask(recommended.startsWith("task:") ? recommended.split(":")[1] as DeskTab : "bulletin");
    return;
  }
  if (kind === "task" || kind === "tab") { notice = ""; openTask(id as DeskTab); return; }
  if (action === "task-help") { modal = "tutorial"; render(); return; }
  if (action === "begin-task") {
    if (!state.tutorials.includes(workTab)) state.tutorials.push(workTab);
    modal = "desk"; persist(); render(); return;
  }
  if (action === "save-bulletin") {
    if (!state.bulletin.source) {
      notice = "Choose the source behind your bulletin, then save it.";
    } else {
      state.bulletinFiled = true;
      notice = "Bulletin saved. Follow the next objective when you’re ready.";
      persist();
    }
    render(); return;
  }
  if (action === "notebook" || action === "map") { modal = action; render(); return; }
  if (action === "review-prompt") {
    promptChecked = true; render();
    queueMicrotask(() => document.getElementById("prompt-feedback")?.focus());
    return;
  }
  if (action === "send-prompt") {
    if (!state.draft.trim()) { notice = "Write your request before sending."; render(); return; }
    modal = "send"; render(); return;
  }
  if (action === "cancel-send") { modal = "desk"; render(); return; }
  if (action === "confirm-send") {
    const check = reviewPrompt(state.draft);
    state.sentPrompt = state.draft; state.leaked ||= !check.safe; state.sentUseful = check.useful;
    promptChecked = true; notice = "Request sent. The response is in your AI request tab.";
    modal = "desk"; persist(); render(); return;
  }
  if (kind === "repair") {
    const item = arrangements.find((repair) => repair.id === id)!;
    if (state.repairs.includes(id)) state.repairs = state.repairs.filter((repair) => repair !== id);
    else if (planCost(state.repairs) + item.cost <= 3) state.repairs.push(id);
    else { notice = "The crew can cover three points. Remove an arrangement before adding this one."; render(); return; }
    planChecked = false; state.planReviewed = false; state.latePlanReviewed = false;
    notice = ""; persist(); render(); return;
  }
  if (action === "preview-plan") {
    if (!state.repairs.length) {
      notice = "Select at least one arrangement, then preview your plan.";
    } else {
      planChecked = true;
      state.planReviewed = true;
      if (state.late) state.latePlanReviewed = true;
      notice = "Preview complete. You can revise the plan or follow the next objective.";
      persist();
    }
    render();
    queueMicrotask(() => document.getElementById("plan-feedback")?.focus());
    return;
  }
  if (action === "ready") {
    if (!readyForBroadcast(state)) {
      notice = currentObjective(state).instruction;
      render(); return;
    }
    state.late = true;
    if (!state.evidence.includes("update")) state.evidence.push("update");
    planChecked = false; state.latePlanReviewed = false; persist();
    openDialogue({ speaker: "Ada", lines: [
      "Hold the microphone. A service notice just arrived. The 17:50 harbour bus is cancelled. The inland road is still open.",
      "The café is still opening at the confirmed time. Noor needs a different way there. I put the notice in your notebook. Recheck the arrangements before you broadcast.",
    ] });
    return;
  }
  if (action === "launch") {
    if (!state.late || !state.latePlanReviewed || !state.bulletinFiled) {
      notice = currentObjective(state).instruction;
      openTask(!state.bulletinFiled ? "bulletin" : "plan");
    } else { modal = "launch"; render(); }
    return;
  }
  if (action === "cancel-launch") { modal = "desk"; render(); return; }
  if (action === "confirm-launch") {
    state.ending = assess(state).ending; state.published = true;
    if (!library.endings.includes(state.ending)) library.endings.push(state.ending);
    library.runs++; persist(); modal = null; screen = "report"; render();
    main.focus();
  }
}
main.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;
  const button = target.closest<HTMLElement>("[data-action]");
  if (button) {
    if (busy) return;
    const action = button.dataset.action!;
    if (button.dataset.x && state && !modal) {
      walkTo(Number(button.dataset.x), Number(button.dataset.y), () => handle(action));
    } else handle(action);
    return;
  }
  const scene = target.closest<HTMLElement>("#scene");
  if (scene && !modal && !busy) {
    const rect = scene.getBoundingClientRect();
    const x = Math.max(12, Math.min(88, (event.clientX - rect.left) / rect.width * 100));
    const y = Math.max(64, Math.min(84, (event.clientY - rect.top) / rect.height * 100));
    walkTo(x, y, () => {});
  }
});
main.addEventListener("input", (event) => {
  if (state && !state.published && event.target instanceof HTMLTextAreaElement) {
    state.draft = event.target.value;
    promptChecked = false; persist();
    document.getElementById("save-status")!.textContent = saveFailed ? "Save unavailable" : "Draft saved";
  }
});
main.addEventListener("change", (event) => {
  if (state && !state.published && event.target instanceof HTMLSelectElement) {
    const field = event.target.dataset.field as keyof GameState["bulletin"];
    state.bulletin[field] = event.target.value;
    state.bulletinFiled = false;
    persist();
    document.getElementById("bulletin-preview")!.innerHTML = bulletinPreview();
  }
});
document.querySelector("header")!.addEventListener("click", (event) => {
  const action = (event.target as HTMLElement).closest<HTMLElement>("[data-action]")?.dataset.action;
  if (action) { event.preventDefault(); clearTimeout(walkTimer); busy = false; handle(action); }
});
document.addEventListener("keydown", (event) => {
  if (!modal) return;
  if (event.key === "Escape" && modal !== "dialogue") { handle("close"); return; }
  if (event.key !== "Tab") return;
  const focusable = Array.from(main.querySelectorAll<HTMLElement>('[role="dialog"] button, [role="dialog"] select, [role="dialog"] textarea, [role="dialog"] summary, [role="dialog"] a'));
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
});
window.addEventListener("pagehide", () => { if (state) persist(); });
render();
