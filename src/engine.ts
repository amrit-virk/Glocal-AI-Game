import type { Scenario } from "./content";
export type Round = {
  attempts: number;
  earned: boolean;
  correct: boolean;
  finished: boolean;
};
export const newRound = (): Round => ({
  attempts: 0,
  earned: false,
  correct: false,
  finished: false,
});
export function evaluate(
  scenario: Scenario,
  selections: string[][],
): boolean[] {
  return scenario.stages.map((stage, i) => {
    const chosen = new Set(selections[i] ?? []);
    return (
      chosen.size === stage.answers.length &&
      stage.answers.every((id) => chosen.has(id))
    );
  });
}
export function submit(
  round: Round,
  scenario: Scenario,
  selections: string[][],
): Round {
  if (round.finished) return round;
  const correct = evaluate(scenario, selections).every(Boolean);
  return {
    attempts: round.attempts + 1,
    earned: round.attempts === 0 ? correct : round.earned,
    correct,
    finished: correct || round.attempts >= 1,
  };
}
