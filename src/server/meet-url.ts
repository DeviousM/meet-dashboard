import type { calendar_v3 } from 'googleapis';

/**
 * Extract the Meet/Hangouts video URL from a Calendar event.
 * Prefers explicit conferenceData video entry points, falls back to the
 * legacy `hangoutLink` field.
 */
export function extractMeetUrl(
  event: calendar_v3.Schema$Event,
): string | undefined {
  const entryPoints = event.conferenceData?.entryPoints ?? [];
  for (const ep of entryPoints) {
    if (ep.entryPointType === 'video' && typeof ep.uri === 'string') {
      return ep.uri;
    }
  }
  if (typeof event.hangoutLink === 'string' && event.hangoutLink.length > 0) {
    return event.hangoutLink;
  }
  return undefined;
}

export { normalizeMeetCode, meetUrlFromCode } from '../shared/meetCode.js';
