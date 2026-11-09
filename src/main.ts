import "./style.css";
import { games, references, type Game } from "./content";
import { newRound, submit, evaluate, type Round } from "./engine";
const main = document.querySelector<HTMLElement>("main")!;
let view: "intro" | "play" | "results" = "intro";
let game: Game | undefined,
  index = 0,
  score = 0,
  stage = 0,
  selections: string[][] = [],
  round: Round = newRound(),
  feedback = false;
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
function home() {
  game = undefined;
  paint(
    `<section class="hero"><p class="eyebrow">THREE GAMES · EVERYDAY AI SKILLS</p><h1>Small games.<br><span>Sharper judgment.</span></h1><p>AI can sound convincing. Practise knowing what to share, what to check, and whose perspective is missing.</p><div class="badge">12 fictional situations · Play at your own pace</div></section><section aria-labelledby="choose"><h2 id="choose">Choose your challenge</h2><div class="cards">${games.map((g, i) => `<article class="card ${g.id}"><span class="game-icon" aria-hidden="true">${g.icon}</span><p class="eyebrow">0${i + 1} / ${g.skill}</p><h3>${g.name}</h3><p>${g.description}</p><a class="button" href="#game/${g.id}">Explore game <span aria-hidden="true">→</span></a><small>4 scenarios · ${g.id === "claim" ? "One decision" : "Two steps"} per scenario</small></article>`).join("")}</div></section><aside class="note"><h2>A practice space, not a test of you.</h2><p>Try an answer, learn why it works, and try again. There’s no timer. Your first answer earns the point; retries are for practice.</p><a href="#sources">Explore the sources →</a></aside>`,
  );
}
function intro(g: Game) {
  view = "intro";
  game = g;
  paint(
    `<section class="panel ${g.id}"><p class="eyebrow">${g.skill}</p><span class="game-icon" aria-hidden="true">${g.icon}</span><h1>${g.name}</h1><p class="lead">${g.description}</p><h2>How to play</h2><p>${g.instructions}</p><p>Four scenarios. One point each on your first submission. If you miss, you can retry once for practice, then see the best answer. Continue whenever you’re ready.</p><p class="badge">All situations and AI outputs are fictional.</p>${button("Start game", "start")}</section>`,
  );
}
function resetScenario() {
  stage = 0;
  selections = game!.scenarios[index].stages.map(() => []);
  round = newRound();
  feedback = false;
}
function scenario() {
  view = "play";
  const g = game!,
    s = g.scenarios[index],
    st = s.stages[stage];
  paint(
    `<section class="panel ${g.id}"><div class="status"><p class="eyebrow">${g.name}</p><span>Scenario ${index + 1} of 4 · Score ${score}/4</span></div><progress aria-label="Scenarios completed" max="4" value="${index}"></progress><h1>${s.title}</h1><div class="situation"><strong>Fictional situation${g.id === "privacy" ? "" : " / AI output"}</strong><p>${esc(s.situation)}</p></div>${feedback ? feedbackHtml() : `<form><p class="eyebrow">Step ${stage + 1} of ${s.stages.length}${round.attempts ? " · Practice retry" : ""}</p><fieldset><legend>${st.question}</legend>${st.options.map((o) => `<label class="option"><input type="${st.multiple ? "checkbox" : "radio"}" name="answer" value="${o.id}" ${selections[stage].includes(o.id) ? "checked" : ""}><span>${esc(o.text)}</span></label>`).join("")}</fieldset><p id="form-error" role="alert"></p><div class="actions">${stage ? button("Back to step 1", "back", true) : ""}<button type="submit">${stage < s.stages.length - 1 ? "Next step" : "Submit answer"}</button></div></form>`}</section>`,
  );
}
function feedbackHtml() {
  const s = game!.scenarios[index],
    checks = evaluate(s, selections);
  return `<section aria-labelledby="feedback-title"><p class="eyebrow">${round.attempts === 1 ? "First attempt" : "Practice attempt"}</p><h2 id="feedback-title">${round.correct ? "Correct — well spotted!" : "Not quite — let’s look closer."}</h2><p>${round.earned ? "You earned 1 point." : round.finished ? "No point this round. Practice still builds the skill." : "No point this round. Try once more for practice."}</p>${s.stages
    .map(
      (st, i) =>
        `<div class="explanation"><h3>Step ${i + 1}: ${checks[i] ? "Correct" : "Needs another look"}</h3>${selections[
          i
        ]
          .map((id) => {
            const o = st.options.find((o) => o.id === id)!;
            return `<p><strong>${esc(o.text)}</strong><br>${esc(o.feedback)}</p>`;
          })
          .join(
            "",
          )}${round.finished ? `<p><strong>Best answer:</strong> ${st.answers.map((id) => esc(st.options.find((o) => o.id === id)!.text)).join("; ")}</p>` : ""}</div>`,
    )
    .join(
      "",
    )}<p class="takeaway"><strong>Take it with you:</strong> ${s.takeaway}</p><p>Read more: ${s.references.map((id) => `<a href="#source/${id}">${references.find((r) => r.id === id)!.publisher}</a>`).join(" · ")}</p><div class="actions">${!round.finished ? button("Retry for practice", "retry") : button(index === 3 ? "See results" : "Continue", "continue")}</div></section>`;
}
function results() {
  view = "results";
  const g = game!;
  paint(
    `<section class="panel ${g.id}"><p class="eyebrow">CHALLENGE COMPLETE</p><h1>${g.name}</h1><p class="score">${score}<span> / 4</span></p><h2>${score === 4 ? "Four thoughtful first choices." : "You’ve made time to practise."}</h2><p>Score counts first submissions only. Practice retries do not change it.</p><p class="takeaway">${g.takeaway}</p><div class="actions">${button("Replay game", "start")}<a class="button secondary" href="#">Return home</a></div><h2>Try another skill</h2>${games
      .filter((x) => x.id !== g.id)
      .map((x) => `<p><a href="#game/${x.id}">${x.name} →</a></p>`)
      .join("")}</section>`,
  );
}
function sources(id?: string) {
  paint(
    `<section class="panel"><p class="eyebrow">BEHIND THE LESSONS</p><h1>Sources & review notes</h1><p>These references support the prototype’s teaching points. The scenarios are fictional, not quotations or advice from these organizations.</p><p class="note">Content review pending: direct access to these publishers was blocked by the development environment. URLs and teaching points need mentor verification before the content is treated as review-ready or released.</p>${game ? button("Return to game", "return", true) : ""}${references.map((r) => `<article class="reference" id="${r.id}" ${r.id === id ? 'tabindex="-1"' : ""}><h2>${r.title}</h2><p>${r.publisher}</p><p>${r.note}</p><a href="${r.url}" target="_blank" rel="noopener noreferrer">Visit source (opens a new tab) →</a></article>`).join("")}</section>`,
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
main.addEventListener("change", () => {
  if (!game || feedback) return;
  selections[stage] = Array.from(
    main.querySelectorAll<HTMLInputElement>("input:checked"),
  ).map((el) => el.value);
});
main.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!selections[stage].length) {
    document.getElementById("form-error")!.textContent =
      "Choose an answer before continuing.";
    return;
  }
  if (stage < game!.scenarios[index].stages.length - 1) {
    stage++;
    scenario();
    return;
  }
  round = submit(round, game!.scenarios[index], selections);
  if (round.attempts === 1 && round.earned) score++;
  feedback = true;
  scenario();
});
main.addEventListener("click", (e) => {
  const action = (e.target as HTMLElement).closest<HTMLElement>("[data-action]")
    ?.dataset.action;
  if (!action) return;
  if (action === "start") {
    view = "play";
    index = 0;
    score = 0;
    resetScenario();
    if (location.hash !== "#play") location.hash = "play";
    else scenario();
  }
  if (action === "back") {
    stage--;
    scenario();
  }
  if (action === "retry") {
    feedback = false;
    stage = 0;
    scenario();
  }
  if (action === "continue") {
    if (index === 3) results();
    else {
      index++;
      resetScenario();
      scenario();
    }
  }
  if (action === "return") {
    location.hash = view === "intro" ? `game/${game!.id}` : "play";
  }
});
window.addEventListener("hashchange", route);
route();
