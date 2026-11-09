# AI Arcade v1

**Status:** Draft build brief for mentor review
**Project context:** GLOCAL National Youth AI Literacy Challenge

## Outcome

Build a mobile-friendly educational website with three short minigames for youth aged 16–24 with limited technical knowledge. Players practise protecting personal information, checking AI-generated claims, and recognizing bias or missing context. A complete v1 is a playable prototype ready for private review, with editable source and clear instructions for running it on a Mac.

## Screens and game flow

- **Home** explains the purpose in plain language and offers a card for each game, with a short description of the skill it teaches. Include a link to Sources.
- **Game intro** gives the player a short objective, instructions, and a Start button.
- **Scenario** shows a fictional situation, a question, and selectable responses. Show progress such as “2 of 4.” Let players change their selections until they submit.
- **Feedback** states the result in words, explains the reasoning, and offers a practical next step. Let the player read at their own pace and explicitly continue. Give each scenario a reference link or a link to its entry on Sources.
- **Results** shows the score out of four, a practical takeaway, and actions to replay, return home, or try another game.
- **Sources** lists the references used for the educational content. Each entry includes title, publisher, link, and a short note about what it supports.

Award one point per scenario when the player's first submission meets the answer criteria. For two-step scenarios, require both steps to earn the point. Allow a retry for practice without changing the first-attempt score, then reveal the best answer and let the player proceed. A full replay starts at scenario one with a fresh score. All feedback and navigation work regardless of score.

## Games and content

Write four complete scenarios per game. The table provides starting points for authoring. Verify the teaching points against credible educational, research, or government sources before treating the answers as ready for mentor review.

| Game | Scenario seed | Decision to practise |
| --- | --- | --- |
| Privacy Protector | A student asks for help rewriting a club roster announcement. | Remove student names and contact details from the fictional prompt, then choose a version that asks for a generic announcement. |
| Privacy Protector | A volunteer drafts a thank-you note using a sign-up sheet. | Remove donor contact details and use a generic description of the event. |
| Privacy Protector | A student wants help summarizing a peer's accommodation request. | Identify the identifying and sensitive details, then select a generic request for an accessible event-planning checklist. |
| Privacy Protector | A club member wants an AI tool to summarize an internal incident note. | Identify confidential details and choose a safer prompt that asks for a blank incident-summary template. |
| Claim Checker | An AI answer gives a confident scholarship deadline. | Check the current deadline on the program provider's official page before sharing it. |
| Claim Checker | An AI answer attributes a quotation to a researcher. | Locate the original publication or recording and verify the wording and context. |
| Claim Checker | An AI answer cites a statistic about youth technology use. | Find the original study and check its date, population, and what was measured. |
| Claim Checker | An AI answer says a transit route has moved. | Check the transit agency's current service notice for the route and date. |
| Bias Detective | An AI list of volunteer opportunities assumes students have cars. | Spot the access assumption and request options reachable by transit or remotely. |
| Bias Detective | An AI answer suggests STEM roles based on gender stereotypes. | Flag the stereotype and choose a response based on interests and relevant skills. |
| Bias Detective | An AI-written event plan assumes all participants have fast home internet. | Identify who may be excluded and choose a response that offers low-bandwidth or offline participation. |
| Bias Detective | An AI summary of school feedback treats a small set of comments as representative. | Identify whose views are missing and qualify the conclusion until more perspectives are gathered. |

Use two stages in **Privacy Protector**: select the sensitive details, then select the safer rewrite. In **Claim Checker**, ask what evidence or verification step should come next. In **Bias Detective**, have the player identify the assumption or gap and choose a fairer, better-supported response.

Write in plain language. Keep scenarios fictional and label fictional AI outputs clearly. Use plausible distractors and give specific feedback about why a choice helps or falls short. Explain how a fluent answer can still be wrong, when authorization matters before sharing information, and how missing perspectives affect decisions. Maintain editable scenario data separate from UI code, with stable IDs, options, answer keys, feedback, takeaways, and reference IDs. Use primary sources where possible, verify URLs, and record unresolved content questions for review.

## Implementation boundaries

- Use the repo's existing stack if available. For a new repo, use a small static web app that can run locally without external services. Reuse the game shell and keep the three interactions distinct.
- Use a restrained arcade look with clear hierarchy, large touch controls, and readable text. Give each game a distinct visual treatment while keeping navigation and feedback consistent.
- Support keyboard navigation, visible focus, labeled controls, and feedback conveyed in text. Ensure dynamic feedback is announced or focused appropriately. Avoid time limits and hover-only interactions.
- Keep the app self-contained. Use fictional examples and avoid personal-data entry, analytics, accounts, live AI, multiplayer, leaderboards, and native app releases.
- Use neutral prototype branding. Keep the build and handover private pending mentor review of branding, hosting, and release. The pilot, formal evaluation report, presentation, and placement submission are separate deliverables.

## Definition of done

1. From home, a player can complete all three games and reach each results screen. All twelve scenarios have working answers, feedback, retries, and references.
2. Verify correct and incorrect selections, both steps of the two-stage games, first-attempt scoring, retry behavior, replay reset, and navigation. Cover core behavior with automated tests where practical.
3. Verify the main flow at phone and desktop widths and with keyboard-only input. Check readable text, visible focus, touch targets, and feedback without relying on colour. Record any checks that could not be run in the environment.
4. The production build succeeds. The README includes exact Mac prerequisites and commands to install, run, test, and build the app, plus instructions for editing scenarios and references.
5. Leave the changes ready for a private GitHub pull request. Summarize checks performed, results, known limitations, and questions for mentor review. Record actual evidence and keep participant feedback and learning outcomes pending until evaluated.
