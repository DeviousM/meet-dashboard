/** Google Meet code format: three groups of letters joined by hyphens (3-4-3). */
const MEET_LETTERS_RE = /^[a-z]{10}$/;

/**
 * Returns the canonical `xxx-xxxx-xxx` code, or null. Dashes and whitespace are
 * optional in the input — `abcdefghij` normalizes the same as `abc-defg-hij`.
 */
export function normalizeMeetCode(input: string): string | null {
  const letters = input.replace(/[\s-]+/g, '').toLowerCase();
  if (!MEET_LETTERS_RE.test(letters)) return null;
  return `${letters.slice(0, 3)}-${letters.slice(3, 7)}-${letters.slice(7)}`;
}

export function meetUrlFromCode(code: string): string | null {
  const normalized = normalizeMeetCode(code);
  return normalized === null ? null : `https://meet.google.com/${normalized}`;
}
