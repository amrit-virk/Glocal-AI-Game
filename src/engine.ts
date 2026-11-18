import type { Bias, Privacy } from "./content";

export function inspectPrompt(puzzle: Privacy, prompt: string) {
  const text = prompt.normalize("NFKC").toLowerCase();
  const words = text.replace(/[^\p{L}\p{N}:]+/gu, " ");
  const exposed = puzzle.privateDetails
    .filter(({ pattern }) => pattern.test(words))
    .map(({ label }) => label);
  if (/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i.test(text)) exposed.push("An email address");
  if (/(?<!\d)(?:\+?1[ .-]?)?(?:\(?\d{3}\)?[ .-]?)?\d{3}[ .-]?\d{4}(?!\d)/.test(text)) {
    exposed.push("A phone number or similar sequence");
  }
  const missing = puzzle.requirements
    .filter(({ pattern }) => !pattern.test(words))
    .map(({ label }) => label);
  return { exposed, missing, solved: !exposed.length && !missing.length };
}

export function testPlan(puzzle: Bias, selected: Set<number>) {
  const coverage = new Set([...selected].flatMap((index) => puzzle.repairs[index].helps));
  return {
    coverage,
    solved: selected.size <= puzzle.slots && coverage.size === puzzle.people.length,
  };
}

export function shuffleCases<T>(cases: readonly T[]): T[] {
  const shuffled = [...cases];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
