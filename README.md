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

Click a person or diamond interaction marker to walk over and interact. Click the floor to move within the clear walking area. Scene exits and the Station map connect all three locations. Objectives do not transport you between rooms. Notebook, map, and menu controls sit inside the game frame. The interface supports Tab and Enter.

Dialogue appears in a bottom text box. Click the text box to reveal the line immediately; click again to advance. Enter does the same. Reduced-motion preferences disable the typewriter and walking transitions.

The compact objective in the game HUD shows the next task and tracks required discoveries. The broadcast desk introduces the public bulletin, AI request, and crew arrangements in order, with a short tutorial for each task. Tutorials can be reopened with How this works. Save the bulletin and preview arrangements to complete each preparation step; these checkpoints record completion without revealing the correct answers. Inspect the original notices and talk to people to learn what the assistant’s starting draft missed. You can review and revise preparations before committing.

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
- `src/sprites.ts` draws original 32 × 48 character sprites. Ada has silver hair, spectacles, and blue workwear. Characters scale with the scene and their floor position; interaction labels appear on hover or keyboard focus.
- `src/style.css` handles the scene atlas, rain and walking motion, text boxes, and responsive layouts.
- `public/art/station-atlas.png` holds four generated pixel-art environments. CSS selects the four equal panels.
- `ART.md` records the environment-art generation prompt.

The first adventure is complete from opening to report. Walking uses short movement across a constrained open floor area. Completion time is a design target of roughly 6–10 minutes and still needs human playtesting.
