# AI Arcade

A private educational prototype for the GLOCAL National Youth AI Literacy Challenge. Three games, twelve fictional scenarios: Privacy Protector, Claim Checker and Bias Detective. No accounts, analytics, personal-data entry or live AI. A first-party cookie stores the daily streak in the current browser. Runs as a static website with no backend or runtime network dependency. Source links open publisher websites only when followed.

**Mentor review is pending.** See [REVIEW.md](REVIEW.md) for the original prototype review record.

## Run on a Mac

Requires macOS, Git, and Node.js **24 LTS** (includes npm). Install Node 24 LTS using the macOS installer from https://nodejs.org/en/download. In Terminal, install Apple command-line tools if Git is unavailable:

```sh
xcode-select --install
```

After that installation completes, open a new Terminal:

```sh
git --version
node --version  # expected v24.x
npm --version

git clone https://github.com/amrit-virk/Glocal-AI-Game.git
cd Glocal-AI-Game
# Before the implementation is merged, check out its PR branch here.
npm ci
npm run dev
```

Open the local address printed by Vite, normally `http://localhost:5173`. Stop the server with Control-C. If working from a downloaded copy, open Terminal in that folder and start with `npm ci`. Node >=22 is supported; validation used Node 24.22.1/npm 11.9.0 on Linux. The Mac instructions have not been executed on physical Mac hardware.

## Verify and build

From the repository folder:

```sh
npm test
npx playwright install chromium
npm run test:e2e
npm run build
npm run preview
```

Open the preview address printed by Vite, normally `http://localhost:4173`. `dist/` contains the production files; keep hosting private until approved. Playwright starts and stops its own development server on port 4173, so stop preview before browser tests. Browser tests cover desktop and phone viewports in Chromium. On Linux with an installed system Chromium, use `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`. Otherwise install Playwright Chromium as above; Linux may also require `npx playwright install-deps chromium` with appropriate system privileges.

`npm test` checks puzzle data and rules. `npm run test:e2e` covers the three interactions, scoring, locked submissions and answer feedback, keyboard activation, and the evidence board layout and accessibility on desktop and phone viewports. `npm run build` runs strict TypeScript checking and builds production assets.

If a managed cloud instance cannot write the default npm cache, use `npm ci --cache /tmp/ai-arcade-npm`.

## Gameplay and content

- **Claim Checker** has four cases. Open evidence, pin the strongest source, and decide whether to share, correct, or hold the AI answer. The review shows the consequence of your choice. The case data in `src/content.ts` defines the verdict, decisive clue, verdict rationale, clue explanations, and lesson.
- **Privacy Protector** lets players rewrite a fictional prompt in a text editor. Each case defines its starting prompt, an example, and local rules for known private details and task requirements. The checker uses patterns and accepts multiple phrasings. The review compares what the original and the rewrite expose and identifies missing task requirements. It cannot evaluate arbitrary prompts or guarantee that a rewrite is safe.
- **Bias Detective** gives players a limited number of repair slots. The case shows what the AI was told and what it recommended. Players can preview the effect of their current repairs for one person before submitting. Each repair lists the people it helps. A replay alternates the volunteer case with a transit remix. A plan succeeds if every person has a way to participate.

Keep references in `src/content.ts` and match each case's reference IDs to that list. Record content verification in `REVIEW.md`.

Each run shuffles all four cases. Submit each case once, review the explanation, then move on. The score appears after the last case. Replay starts a new shuffled run. Reload resets progress. The Sources screen can return to an in-progress case.

## Review and handover

See [REVIEW.md](REVIEW.md) for validation evidence and outstanding content checks, and [PR_DESCRIPTION.md](PR_DESCRIPTION.md) for a draft private pull request description. This prototype has no participant feedback or measured learning outcomes yet. No public deployment is included.

## Daily streak

Finishing all four cases in any game counts as one practice day, regardless of score. Repeated completions on the same local calendar day count once. Consecutive days extend the streak. Missing a day resets the current streak while keeping the best streak.

The cookie stores the last completion date, current streak, and best streak for up to one year. It is scoped to this site's path. Clearing cookies or switching browsers/devices starts a separate history. Localhost and GitHub Pages have separate cookies. If cookies are blocked, the game displays a save message after completion. This browser-based feature uses the device clock and can be edited by the user.
