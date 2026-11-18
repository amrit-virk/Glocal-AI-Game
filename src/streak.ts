export type Streak = {
  version: 1;
  lastDay: string;
  current: number;
  best: number;
};

export function localDay(date = new Date()): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function dayNumber(day: string): number {
  const parsed = new Date(day + "T00:00:00Z");
  return /^\d{4}-\d{2}-\d{2}$/.test(day) &&
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === day
    ? parsed.getTime() / 86_400_000
    : NaN;
}

export function parseStreak(value: string | undefined): Streak | undefined {
  try {
    const streak = JSON.parse(value ?? "") as Streak;
    if (
      streak?.version === 1 &&
      Number.isFinite(dayNumber(streak.lastDay)) &&
      Number.isSafeInteger(streak.current) &&
      streak.current > 0 &&
      Number.isSafeInteger(streak.best) &&
      streak.best >= streak.current
    ) return streak;
  } catch {
    // A damaged cookie starts a fresh history.
  }
  return undefined;
}

export function currentStreak(streak: Streak | undefined, today: string): number {
  if (!streak) return 0;
  const gap = dayNumber(today) - dayNumber(streak.lastDay);
  return gap >= 0 && gap <= 1 ? streak.current : 0;
}

export function completeDay(streak: Streak | undefined, today: string): Streak {
  if (!Number.isFinite(dayNumber(today))) throw new Error("Invalid completion date");
  // Repeated finishes and a clock moving backwards cannot add days.
  if (streak && dayNumber(today) <= dayNumber(streak.lastDay)) return streak;
  const current = currentStreak(streak, today) + 1;
  return { version: 1, lastDay: today, current, best: Math.max(streak?.best ?? 0, current) };
}

const cookieName = "ai_arcade_streak_v1";

export function readStreak(): Streak | undefined {
  try {
    const cookie = document.cookie.split("; ").find((part) => part.startsWith(cookieName + "="));
    return cookie ? parseStreak(decodeURIComponent(cookie.slice(cookieName.length + 1))) : undefined;
  } catch {
    return undefined;
  }
}

export function saveCompletion(today = localDay()): boolean {
  const next = completeDay(readStreak(), today);
  try {
    const path = new URL(".", location.href).pathname;
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = cookieName + "=" + encodeURIComponent(JSON.stringify(next)) +
      "; Path=" + path + "; Max-Age=31536000; SameSite=Lax" + secure;
    const saved = readStreak();
    return saved?.lastDay === next.lastDay && saved.current === next.current && saved.best === next.best;
  } catch {
    return false;
  }
}
