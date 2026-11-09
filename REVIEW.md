# Private v1 review record

## Scope and status

Implements the twelve scenarios and screen flow in SPEC.md. The application is playable; educational reference verification is still blocked. Do not treat content as verified or release publicly until that check is complete. SPEC.md remains unchanged.

## Validation — 2026-11-09

Environment: Linux, Node 24.22.1, npm 11.9.0, system Chromium. macOS hardware, Safari, Firefox and assistive-technology sessions were not available/tested.

- Clean `npm ci --cache /tmp/ai-arcade-npm --no-audit --no-fund`: passed.
- `npm test`: 14 tests passed, none skipped. Exercises every scenario, both stages independently, incorrect answers, exact-set checkbox matching, retries without score changes, attempt finality, stable IDs and reference integrity.
- `npm run build`: strict TypeScript checking and Vite production build passed.
- `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`: desktop 1280×900 and phone 390×844. Full correct paths through all twelve scenarios, incorrect/retry flows, zero-score completion, editable selections, replay reset, source return navigation, keyboard operation and overflow checks. 14 browser tests passed, none skipped.
- Axe checks on home, question, feedback and results: no detected violations in checked states. This is not a full accessibility audit.
- Phone scenario screenshot visually inspected: readable text, wrapped choices, vertically stacked large controls, no clipped content. Browser tests generate fresh screenshots in ignored `test-results/`.
- Keyboard test uses Tab, Space and Enter through a two-stage interaction; focus moves to main on screen transitions. Native labeled radios/checkboxes remain keyboard-operable. No timer, hover-only interaction or color-only feedback.
- Production preview browser smoke: completed all four Claim Checker scenarios with 4/4, returned from Sources to results, no JavaScript page errors.
- `git diff --check`: passed.

Initial failures were corrected: a stray CSS import broke the first build; initial page focus skipped the skip link; the keyboard test needed to wait for hash navigation before sending its next key. These failures are not counted as passing runs.

## Source verification blocker

Direct HTTPS requests to the following publishers returned proxy `403 Forbidden` at CONNECT; publisher content could not be inspected, and these are not confirmed live URLs. No TLS or signature verification was bypassed. GitHub/package access works, so this is a destination-policy restriction rather than general loss of connectivity.

| Reference | Scenarios | Required review |
| --- | --- | --- |
| Office of the Privacy Commissioner of Canada, generative AI principles | All Privacy Protector scenarios | Confirm URL, privacy guidance, authorization/consent nuance and suitability for youth. |
| NIST, AI Risk Management Framework | All Claim Checker scenarios | Confirm URL and specific evidence supporting verification and reliability lessons. |
| UNESCO, Recommendation on AI Ethics | All Bias Detective scenarios | Confirm URL and fairness/inclusion teaching points. |
| Statistics Canada, Sampling methods | Statistic and school-feedback scenarios | Confirm URL and treatment of population, sample and representativeness. |

A saved environment draft proposes only four new custom domains: `www.priv.gc.ca`, `www.nist.gov`, `www.unesco.org`, `www150.statcan.gc.ca`. Package-manager presets were preserved. Saving the draft did not apply access or publish the environment. After settings are applied, retry each URL, read the primary material, record the actual verification date and relevant sections here, and update the on-screen pending notes. Follow any required redirects through the settings flow. Never mark a blocked request as verified.

## Mentor questions before release

1. Are the privacy explanations and fictional scenarios appropriate for the intended 16–24 audience and local policies? Generic prompting is an alternative, not an assertion that all AI tools handle data identically.
2. Are the distractors sufficiently plausible and the language understandable? Conduct participant testing; no learning outcomes or participant feedback have been measured.
3. Approve reference accuracy, neutral branding, hosting and any eventual public release. The current build is a private prototype.
4. Review keyboard/screen-reader behavior and phone usability with real users and Safari on a Mac/iPhone. Automated checks do not replace this.

## Known behavior

State is in memory and resets on reload. Choosing a game from Home starts a new session. Sources has a return button to preserve the current intro, round or results screen. There is no personal-data input or remote scoring. No account, live AI, multiplayer, analytics, leaderboard or public deployment is included.
