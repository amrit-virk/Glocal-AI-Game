# Last Light Radio · AI Arcade

A short, single-player pixel-art adventure about checking an AI-assisted radio bulletin. Explore the broadcast room, equipment room, and sheltered courtyard, meet the volunteers, and prepare the evening broadcast.

## Run locally

Requires Node.js 22 or newer. Node 24 is used for deployment.

```sh
npm ci
npm run dev
```

Open the address Vite prints, normally http://localhost:5173/.

## Play

Click a person or glowing marker to walk over and interact. Click the floor to move within the clear walking area. Scene exits and the Station map connect all three locations. The interface supports Tab and Enter.

Dialogue appears in a bottom text box. Use Show text to reveal the line immediately. Continue advances it. Reduced-motion preferences disable the typewriter and walking transitions.

The broadcast desk contains the public bulletin, AI request, and crew arrangements. Inspect the original notices and talk to people to learn what the assistant’s starting draft missed. You can review and revise preparations before committing.

Sending an AI request is a permanent story choice. A later revision cannot erase an earlier disclosure. Ready for broadcast advances the story to the late notice. Broadcast commits the final bulletin and plan. The report explains each outcome, and the title screen collects all three discovered endings.

The assistant is simulated. Prompt review uses case-specific patterns, not a remote model or a general safety assessment. All names, notices, and incidents are fictional. Mentor review of educational content is pending.

## Saving

The current adventure is automatically saved in this browser’s localStorage under `last_light_save_v2`. Evidence, conversations completed, drafts, decisions, and the ending are retained. The title screen offers Continue or a new shift. New shifts replace the current adventure but preserve the ending collection under `last_light_endings_v1`.

Localhost and GitHub Pages have separate storage. Clearing site data removes progress. A save failure is shown in the interface. The previous daily streak system is retired.

## Verify and deploy

```sh
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

The browser suite checks all three endings, irreversible disclosure, recovery after the late message, local save/resume, new runs preserving the collection, crew budget, storage failures, responsive layout, and automated accessibility.

Set `CHROMIUM_PATH` to an installed Chromium-compatible executable if Playwright’s bundled browser is unavailable. The Pages workflow builds with `--base=/Glocal-AI-Game/` and deploys `dist/`.

## Edit the adventure

- `src/content.ts` defines rooms, documents, conversations, arrangements, and endings.
- `src/engine.ts` defines prompt checks, plan coverage, ending rules, and saved-state validation.
- `src/main.ts` handles scenes, dialogue, tasks, and local saves.
- `src/sprites.ts` draws small original character sprites.
- `src/style.css` handles the scene atlas, rain and walking motion, text boxes, and responsive layouts.
- `public/art/station-atlas.png` holds four generated pixel-art environments. CSS selects the four equal panels.
- `ART.md` records the environment-art generation prompt.

The first adventure is complete from opening to report. Walking uses short movement across a constrained open floor area. Completion time is a design target of roughly 6–10 minutes and still needs human playtesting.
