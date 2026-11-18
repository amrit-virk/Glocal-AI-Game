import "./style.css";
import { games, references, type Game, type Privacy, type Puzzle, type Verdict } from "./content";
import { inspectPrompt, shuffleCases, testPlan } from "./engine";
import { currentStreak, localDay, readStreak, saveCompletion } from "./streak";
const main = document.querySelector<HTMLElement>("main")!;
let view: "intro" | "play" | "results" = "intro";
let game: Game | undefined,
  index = 0,
  score = 0,
  outcome: "playing" | "solved" | "missed" = "playing";
let cases: Puzzle[] = [];
let streakSaved = true;
const opened = new Set<number>();
const selected = new Set<number>();
let pinned: number | undefined;
let verdict: Verdict | undefined;
let draft = "";
let preview: { person: number; canParticipate: boolean } | undefined;
let promptReview: ReturnType<typeof inspectPrompt> | undefined;
const esc = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
let initialRender = true;
function paint(html: string) {
  main.innerHTML = html;
  if (!initialRender) main.focus();
  initialRender = false;
  window.scrollTo(0, 0);
}
function button(text: string, action: string, secondary = false) {
  return `<button class="${secondary ? "secondary" : ""}" data-action="${action}">${text}</button>`;
}
const gameActions = {
  claim: "Investigate a claim",
  privacy: "Rewrite a prompt",
  bias: "Repair a plan",
};

const previews = {
  claim: `<div class="sample sample-source"><span class="sample-kicker">SERVICE UPDATE · SATURDAY</span><b>Route 18</b><span>Boards at <mark>Cedar Street</mark></span><span class="sample-stamp">SOURCE 02</span></div>`,
  privacy: `<div class="sample sample-prompt"><span class="sample-kicker">DRAFT PROMPT</span><span>Invite students to the meetup.</span><span><del>Include the RSVP list.</del></span><span class="sample-cursor">▍</span></div>`,
  bias: `<div class="sample sample-plan"><span class="sample-kicker">REPAIR SLOTS</span><div><span>01</span> Move the venue</div><div><span>02</span> Add another shift</div></div>`,
};

function streakPanel() {
  const streak = readStreak();
  const today = localDay();
  const current = currentStreak(streak, today);
  const doneToday = streak?.lastDay === today;
  return `<section class="streak-panel" aria-labelledby="streak-heading">
    <div><h2 id="streak-heading">Daily streak</h2>
      <p>${doneToday ? "Today’s practice is complete. Come back tomorrow to keep it going."
        : current ? "Finish any game today to keep your streak going."
        : "Finish any game to start a streak. Each day of practice counts."}</p>
    </div>
    <dl><div><dt>Current</dt><dd>${current} ${current === 1 ? "day" : "days"}</dd></div>
      <div><dt>Best</dt><dd>${streak?.best ?? 0} ${streak?.best === 1 ? "day" : "days"}</dd></div></dl>
    <p class="streak-note">Saved in this browser with a cookie. Days follow your device’s local time.</p>
    ${streakSaved ? "" : '<p role="status">Your browser couldn’t save this streak. Allow cookies for this site to keep it between visits.</p>'}
  </section>`;
}

function home() {
  game = undefined;
  paint(`
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">An AI literacy workshop</p>
        <h1>Use AI with<br>better judgment<span>.</span></h1>
        <p>Three short games about checking claims, protecting information, and spotting who gets left out.</p>
        <a class="button" href="#choose" data-jump>Choose a game <span aria-hidden="true">↓</span></a>
      </div>
      <div class="hero-art" aria-hidden="true">
        <div class="hero-grid"></div>
        <div class="hero-sheet hero-sheet-back"></div>
        <div class="hero-sheet hero-sheet-front">
          <span>AI RESPONSE</span><i></i><i></i><i></i><i></i>
          <svg viewBox="0 0 140 140" fill="none" focusable="false">
            <path d="M90 90l35 35" stroke="currentColor" stroke-width="13" stroke-linecap="round"/>
            <circle cx="61" cy="61" r="39" stroke="currentColor" stroke-width="10"/>
            <path d="M42 61l13 13 23-25" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    </section>
    ${streakPanel()}
    <section class="game-picker" aria-labelledby="choose">
      <div class="section-heading"><h2 id="choose" tabindex="-1">Choose a game</h2><span>4 cases each · Untimed</span></div>
      <div class="cards">${games.map((g, i) => `
        <article class="card ${g.id}">
          <a href="#game/${g.id}" aria-labelledby="game-name-${g.id}">
            <div class="card-preview" aria-hidden="true">${previews[g.id]}</div>
            <div class="card-copy"><p class="eyebrow">0${i + 1} / ${gameActions[g.id]}</p>
              <h3 id="game-name-${g.id}">${g.name}</h3><p>${g.description}</p>
              <span class="arrow" aria-hidden="true">↗</span>
            </div>
          </a>
        </article>`).join("")}
      </div>
    </section>`);
}
function intro(g: Game) {
  view = "intro";
  game = g;
  paint(`<section class="game-menu ${g.id}">
    <a class="back-link" href="#">← All games</a>
    <div class="game-banner">
      <div class="banner-copy">
        <p class="eyebrow">${gameActions[g.id]}</p>
        <h1>${g.name}</h1>
        <p class="lead">${g.description}</p>
        <p class="game-meta">${g.scenarios.length} cases · Untimed</p>
      </div>
      <div class="banner-art" aria-hidden="true">${previews[g.id]}</div>
    </div>
    <section class="how-to" aria-labelledby="how-to">
      <h2 id="how-to">How to play</h2>
      <ol class="steps" role="list">${g.instructions.map((step, i) => `<li><span aria-hidden="true" data-step="0${i + 1}"></span><p>${esc(step)}</p></li>`).join("")}</ol>
      <p class="muted">Cases appear in random order. Each submission is final, and your score appears after the last case. Finish all four cases to count today toward your streak.</p>
      <div class="actions">${button("Start game", "start")}</div>
    </section>
  </section>`);
}
function resetScenario() {
  outcome = "playing";
  opened.clear();
  selected.clear();
  pinned = undefined;
  preview = undefined;
  verdict = undefined;
  const p = cases[index];
  draft = p.kind === "privacy" ? p.original : "";
  promptReview = undefined;
}
const verdicts: Record<Verdict, string> = {
  "The evidence supports it": "Share as written",
  "The evidence contradicts it": "Correct before sharing",
  "There’s not enough evidence": "Hold for more evidence",
};
const verdictOptions = Object.entries(verdicts) as [Verdict, string][];

function toggle(text: string, action: string, active: boolean, extra = "") {
  return `<button type="button" class="secondary" data-action="${action}" aria-pressed="${active}" ${extra}>${esc(text)}</button>`;
}

function controls(label: string) {
  return `<p id="form-error" role="alert"></p><div class="actions">${button(label, "check")}</div>`;
}

function board(p: Exclude<Puzzle, Privacy>) {
  if (p.kind === "claim") {
    return `<div class="workbench">
      <section class="workbench-panel"><h2>Evidence</h2><div class="pieces">${p.evidence.map((card, i) =>
        `<article class="evidence ${pinned === i ? "evidence-selected" : ""}"><span class="file-index">0${i + 1}</span><div><h3>${esc(card.title)}</h3>${opened.has(i)
          ? `<p>${esc(card.text)}</p>${toggle(pinned === i ? "Evidence selected" : "Use as evidence", "pin-" + i, pinned === i, `aria-label="Use ${esc(card.title)} as evidence"`)}`
          : `<button class="secondary" data-action="open-${i}" aria-label="Read ${esc(card.title)}">Read source</button>`}</div></article>`).join("")}
      </div></section>
      <section class="toolbox"><h2>What will you share?</h2>
        <p class="muted" aria-live="polite">${pinned === undefined ? "Choose the source that best supports your decision." : "Selected evidence"}</p>
        ${pinned === undefined ? "" : `<div class="pinned-source"><h3>${esc(p.evidence[pinned].title)}</h3><p>${esc(p.evidence[pinned].text)}</p></div>`}
        <div class="pieces">${verdictOptions.map(([value, label], i) => toggle(label, "verdict-" + i, verdict === value)).join("")}</div>
        ${controls("Submit decision")}
      </section></div>`;
  }
  return `<div class="workbench"><section class="workbench-panel"><h2>Repair options</h2><p class="muted" aria-live="polite">${selected.size} of ${p.slots} repair slots used</p>
    <ol class="repair-slots" aria-label="Repair slots">${Array.from({ length: p.slots }, (_, slot) => {
      const repair = p.repairs[[...selected][slot]];
      return `<li class="${repair ? "filled" : ""}"><span>Slot ${slot + 1}</span>${repair ? esc(repair.text) : "Open"}</li>`;
    }).join("")}</ol>
    <div class="pieces">${p.repairs.map((repair, i) => toggle(repair.text, "select-" + i, selected.has(i))).join("")}</div>
    ${controls("Test the plan")}
    </section><section class="toolbox"><h2>Who needs this plan?</h2>
    <p class="muted">${preview ? "Preview used. You can still change your repairs." : "Choose your repairs, then preview the plan for one person before you submit."}</p>
    <ul class="people">${p.people.map((person, i) => `<li><span class="person-initial" aria-hidden="true">${esc(person.name[0])}</span><div>
      <strong>${esc(person.name)}</strong><p>${esc(person.barrier)}</p>
      ${preview?.person === i ? `<p class="play-preview" tabindex="-1" id="plan-preview">With the repairs you tested: ${preview.canParticipate ? "can participate." : "still faces a barrier."}</p>`
        : preview ? "" : button("Preview for " + esc(person.name), "preview-" + i, true)}
      </div></li>`).join("")}</ul></section></div>`;
}

function promptFeedback(p: Privacy) {
  if (!promptReview) return `<h2>Before you submit</h2><p>Check your rewrite for details that identify someone and for instructions the task still needs. You have one submission.</p>`;
  const { exposed, missing, solved } = promptReview;
  const removed = inspectPrompt(p, p.original).exposed.filter((detail) => !exposed.includes(detail));
  return `<h2 id="rewrite-result" tabindex="-1">${solved ? "Case solved" : "Review your rewrite"}</h2>
    ${removed.length ? `<h3>Private details removed</h3><ul>${removed.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : ""}
    ${exposed.length ? `<h3>What the AI would still receive</h3><p>These details can identify someone or expose information the tool doesn’t need.</p><ul>${exposed.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : "<p>No known private details found in this case.</p>"}
    ${missing.length ? `<h3>Keep the task clear</h3><p>Restore these instructions so the rewritten prompt still does the job.</p><ul>${missing.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : "<p>The rewrite keeps the task requirements.</p>"}
    <p class="takeaway">${esc(p.lesson)}</p><p><a href="#source/privacy">Read the privacy reference</a></p>
    <details><summary>See an example rewrite</summary><p>${esc(p.example)}</p></details>`;
}

function promptEditor(p: Privacy) {
  const finished = outcome !== "playing";
  return `<div class="workbench"><section class="workbench-panel">
    <section class="original-prompt" aria-labelledby="original-prompt-title">
      <h2 id="original-prompt-title">Original prompt</h2>
      <p>${esc(p.original)}</p>
    </section>
    <label class="editor-label" for="prompt">Your rewrite</label>
    <textarea id="prompt" maxlength="1600" spellcheck="false" aria-describedby="prompt-note" ${finished ? "readonly" : ""}>
${esc(draft)}</textarea>
    <p class="muted" id="prompt-note">Use fictional details only. This case-specific check runs on your device.</p>
    ${finished ? "" : controls("Check rewrite")}
    </section><section class="toolbox ${finished ? "review-sheet" : ""}" id="prompt-review">${promptFeedback(p)}${finished ? nextCase() : ""}</section></div>`;
}

function scenario(preserveFocus?: string) {
  view = "play";
  const g = game!;
  const p = cases[index];
  const aiContext = p.kind === "claim" ? `<section class="ai-context"><h2>AI answer</h2><p>${esc(p.aiAnswer)}</p></section>`
    : p.kind === "bias" ? `<div class="ai-comparison"><section class="ai-context"><h2>What the AI was told</h2><p>${esc(p.aiInput)}</p></section><section class="ai-context"><h2>What the AI recommended</h2><p>${esc(p.aiPlan)}</p></section></div>`
    : "";
  const html = `<section class="panel game ${g.id}"><div class="case-header"><div class="status"><p class="eyebrow">${g.name}</p><span>Case ${index + 1} of ${cases.length}</span></div>
    <progress aria-label="Cases completed" max="${cases.length}" value="${index + Number(outcome !== "playing")}"></progress>
    <h1>${esc(p.title)}</h1><div class="situation"><p class="eyebrow">${p.kind === "claim" ? "Case brief" : "Your assignment"}</p><p>${esc(p.brief)}</p></div>${aiContext}</div>
    ${p.kind === "privacy" ? promptEditor(p) : outcome === "playing" ? board(p) : feedbackHtml(p)}</section>`;
  if (!preserveFocus) return paint(html);
  main.innerHTML = html;
  main.querySelector<HTMLElement>(`[data-action="${preserveFocus}"]`)?.focus({ preventScroll: true });
}

function nextCase() {
  return `<div class="actions">${button(index === cases.length - 1 ? "See results" : "Next case", "continue")}</div>`;
}

function feedbackHtml(p: Exclude<Puzzle, Privacy>) {
  let report: string;
  if (p.kind === "claim") {
    const clue = p.evidence[pinned!];
    const best = p.evidence[p.decisive];
    report = `<div class="play-preview"><h3>What happens next</h3><p>${esc(p.consequences[verdict!])}</p></div>
      <h3>Your decision · ${verdicts[verdict!]}</h3>
      <p>${verdict === p.verdict ? "Your decision was correct." : `Best decision: <strong>${verdicts[p.verdict]}</strong>.`} ${esc(p.reasoning)}</p>
      <h3>Your clue · ${esc(clue.title)}</h3><p>${esc(clue.why)}</p>
      ${pinned !== p.decisive ? `<h3>Stronger clue · ${esc(best.title)}</h3><p>${esc(best.why)}</p>` : ""}`;
  } else {
    const { coverage } = testPlan(p, selected);
    report = `<h3>What the AI missed</h3><p>${esc(p.gap)}</p>
      <h3>What your repairs changed</h3>
      <ul>${[...selected].map((i) => `<li><strong>${esc(p.repairs[i].text)}</strong><br>${esc(p.repairs[i].impact)}</li>`).join("")}</ul>
      <h3>Who can participate?</h3>
      <ul>${p.people.map((person, i) => `<li><strong>${esc(person.name)}:</strong> ${coverage.has(i) ? "Can participate." : `Still faces a barrier. ${esc(person.barrier)}`}</li>`).join("")}</ul>
      ${outcome === "missed" ? `<h3>One plan that reaches everyone</h3><ul>${p.example.map((i) => `<li>${esc(p.repairs[i].text)}</li>`).join("")}</ul>` : ""}`;
  }
  return `<section class="review-sheet" aria-labelledby="feedback-title"><p class="eyebrow">Case feedback</p><h2 id="feedback-title">${outcome === "solved" ? "Case solved" : "Case review"}</h2>
    ${report}<p class="takeaway">${esc(p.lesson)}</p>
    <p>Read more: ${p.references.map((id) => `<a href="#source/${id}">${references.find((r) => r.id === id)!.publisher}</a>`).join(" · ")}</p>
    ${nextCase()}</section>`;
}

function results() {
  view = "results";
  const g = game!;
  paint(`<section class="game-menu ${g.id}">
    <a class="back-link" href="#">← All games</a>
    <div class="game-banner result-banner">
      <div class="banner-copy">
        <p class="eyebrow">Run complete</p>
        <h1>${g.name}</h1>
        <p class="lead">${g.takeaway}</p>
        <div class="actions">${button("Replay game", "start")}</div>
      </div>
      <div class="result-score">
        <p class="eyebrow">Cases solved</p>
        <p class="score">${score}<span> / ${cases.length}</span></p>
        <div class="score-track" aria-hidden="true">${cases.map((_, i) => `<span class="${i < score ? "scored" : ""}"></span>`).join("")}</div>
      </div>
    </div>
    ${streakPanel()}
    <section class="other-games" aria-labelledby="another-game">
      <h2 id="another-game">Try another game</h2>
      <div class="next-games">${games.filter((other) => other.id !== g.id).map((other) => `
        <a class="${other.id}" href="#game/${other.id}">
          <div><span class="eyebrow">${gameActions[other.id]}</span><strong>${other.name}</strong></div>
          <span class="arrow" aria-hidden="true">↗</span>
        </a>`).join("")}</div>
    </section>
  </section>`);
}
function sources(id?: string) {
  paint(
    `<section class="panel"><p class="eyebrow">BEHIND THE LESSONS</p><h1>Sources & review notes</h1><p>These references support the prototype’s teaching points. The scenarios are fictional, not quotations or advice from these organizations.</p><p class="note">The fictional scenarios are for practice. Mentor review of the cases is pending.</p>${game ? button("Return to game", "return", true) : ""}${references.map((r) => `<article class="reference" id="${r.id}" ${r.id === id ? 'tabindex="-1"' : ""}><h2>${r.title}</h2><p>${r.publisher}</p><p>${r.note}</p><a href="${r.url}" target="_blank" rel="noopener noreferrer">Visit source (opens a new tab) →</a></article>`).join("")}</section>`,
  );
  if (id) document.getElementById(id)?.focus();
}
function route() {
  const hash = location.hash.slice(1);
  if (hash === "main") {
    main.focus();
    return;
  }
  if (hash === "sources") return sources();
  if (hash.startsWith("source/")) return sources(hash.split("/")[1]);
  if (hash === "play" && game)
    return view === "results" ? results() : scenario();
  const g = games.find((g) => hash === `game/${g.id}`);
  if (g) return intro(g);
  home();
}
main.addEventListener("input", (event) => {
  if (event.target instanceof HTMLTextAreaElement && event.target.id === "prompt") {
    draft = event.target.value;
    document.getElementById("form-error")?.replaceChildren();
  }
});
main.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  if (target.closest("[data-jump]")) {
    e.preventDefault();
    document.getElementById("choose")?.focus();
    return;
  }
  const action = target.closest<HTMLElement>("[data-action]")
    ?.dataset.action;
  if (!action || !game) return;
  if (action === "start") {
    index = 0;
    score = 0;
    const replay = view === "results";
    cases = shuffleCases(game.scenarios.map((puzzle) =>
      replay && puzzle.kind === "bias" && puzzle.remix && !cases.includes(puzzle.remix)
        ? puzzle.remix : puzzle,
    ));
    view = "play";
    resetScenario();
    if (location.hash !== "#play") location.hash = "play";
    else scenario();
    return;
  }
  if (action === "return") {
    location.hash = view === "intro" ? `game/${game.id}` : "play";
    return;
  }
  if (action === "continue" && outcome !== "playing") {
    if (index === cases.length - 1) return results();
    index++;
    resetScenario();
    return scenario();
  }

  if (outcome !== "playing") return;
  const p = cases[index];
  const error = document.getElementById("form-error")!;
  if (action === "check") {
    if (p.kind === "claim" && (pinned === undefined || verdict === undefined)) {
      error.textContent = "Choose a source and a sharing decision before submitting.";
      return;
    }
    if (p.kind === "privacy") {
      if (!draft.trim()) {
        error.textContent = "Write a prompt before checking it.";
        return;
      }
      promptReview = inspectPrompt(p, draft);
    }
    if (p.kind === "bias" && !selected.size) {
      error.textContent = "Choose at least one repair before submitting.";
      return;
    }
    const solved = p.kind === "claim" ? pinned === p.decisive && verdict === p.verdict
      : p.kind === "privacy" ? promptReview!.solved
      : testPlan(p, selected).solved;
    if (solved) score++;
    if (index === cases.length - 1) streakSaved = saveCompletion();
    outcome = solved ? "solved" : "missed";
    scenario();
    document.getElementById("rewrite-result")?.focus();
    return;
  }
  const [move, value] = action.split("-");
  const i = Number(value);
  if (move === "open") {
    opened.add(i);
    return scenario("pin-" + i);
  }
  if (move === "pin") pinned = pinned === i ? undefined : i;
  if (move === "verdict") verdict = verdictOptions[i][0];
  if (move === "preview" && p.kind === "bias" && !preview) {
    if (!selected.size) {
      error.textContent = "Choose a repair before previewing the plan.";
      error.scrollIntoView({ block: "nearest" });
      return;
    }
    preview = { person: i, canParticipate: testPlan(p, selected).coverage.has(i) };
    scenario(action);
    document.getElementById("plan-preview")?.focus({ preventScroll: true });
    return;
  }
  if (move === "select") {
    if (selected.has(i)) selected.delete(i);
    else if (p.kind === "bias" && selected.size >= p.slots) {
      error.textContent = "Remove a repair before adding another.";
      return;
    } else selected.add(i);
  }
  scenario(action);
});
window.addEventListener("hashchange", route);
route();
