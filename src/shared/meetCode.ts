/** Google Meet code format: three groups of letters joined by hyphens (3-4-3). */
const MEET_CODE_RE = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/i;

/** Returns the canonical (lowercased, whitespace-stripped) code, or null. */
export function normalizeMeetCode(input: string): string | null {
  const trimmed = input.replace(/\s+/g, '').toLowerCase();
  return MEET_CODE_RE.test(trimmed) ? trimmed : null;
}

export function meetUrlFromCode(code: string): string | null {
  const normalized = normalizeMeetCode(code);
  return normalized === null ? null : `https://meet.google.com/${normalized}`;
}
