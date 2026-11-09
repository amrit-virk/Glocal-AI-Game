# AI Arcade v1

A private educational prototype for the GLOCAL National Youth AI Literacy Challenge. Three games, twelve fictional scenarios: Privacy Protector, Claim Checker and Bias Detective. No accounts, analytics, personal-data entry or live AI. Runs as a static website with no backend or runtime network dependency. Source links open publisher websites only when followed.

**Content verification is pending.** Reference publishers could not be reached under the cloud environment’s network policy. See [REVIEW.md](REVIEW.md) before treating the teaching content as verified or releasing it.

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

`npm test` exercises the scoring engine and content integrity. `npm run test:e2e` exercises actual inputs, all twelve scenarios, feedback, source navigation, replay reset, retries, zero-score completion, keyboard controls, layout overflow and automated axe accessibility checks. Screenshots/results are written to ignored `test-results/`. `npm run build` runs strict TypeScript checking and builds production assets.

If a managed cloud instance cannot write the default npm cache, use `npm ci --cache /tmp/ai-arcade-npm`. Use the existing isolated checkout; no extra Git worktree is required.

## Edit content

- `src/content.ts`: games, scenarios and references. Keep scenario IDs stable. Each stage has a question, options with stable IDs and specific feedback, and an `answers` array of option IDs. `multiple: true` renders checkboxes; other stages render radio buttons. Privacy and bias games have two stages; claims have one. Each game must retain four scenarios unless UI totals and tests are deliberately updated.
- `references` entries contain a stable ID, title, publisher, URL and supporting note. Scenario `references` must match those IDs. Record checks and unresolved questions in `REVIEW.md`.
- `src/engine.ts`: exact-set answer checking, first-attempt points and the single practice retry.
- `src/main.ts`: shared screen flow and UI. `src/style.css`: responsive layout, colors and focus styles.

Answers may change before submission, including returning from step two to step one. Both stages must be right to earn the point. A failed first attempt allows one practice retry; after that the best answers are revealed. Replay clears the score and starts at scenario one. State stays in memory only: reload or leaving a game starts over. Use the “Return to game” button on Sources to preserve your place during the session.

## Review and handover

See [REVIEW.md](REVIEW.md) for validation evidence and outstanding content checks, and [PR_DESCRIPTION.md](PR_DESCRIPTION.md) for a draft private pull request description. This prototype has no participant feedback or measured learning outcomes yet. No public deployment is included.
