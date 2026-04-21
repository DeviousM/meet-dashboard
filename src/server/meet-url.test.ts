import { describe, expect, it } from 'vitest';
import type { calendar_v3 } from 'googleapis';
import { extractMeetUrl } from './meet-url';

describe('extractMeetUrl', () => {
  it('returns the conferenceData video URI when present', () => {
    const event: calendar_v3.Schema$Event = {
      conferenceData: {
        entryPoints: [
          { entryPointType: 'phone', uri: 'tel:+1-555-0100' },
          {
            entryPointType: 'video',
            uri: 'https://meet.google.com/abc-defg-hij',
          },
        ],
      },
      hangoutLink: 'https://meet.google.com/old-link-zzz',
    };
    expect(extractMeetUrl(event)).toBe('https://meet.google.com/abc-defg-hij');
  });

  it('falls back to hangoutLink when no video entry point is present', () => {
    const event: calendar_v3.Schema$Event = {
      hangoutLink: 'https://meet.google.com/abc-defg-hij',
    };
    expect(extractMeetUrl(event)).toBe('https://meet.google.com/abc-defg-hij');
  });

  it('returns undefined when neither is present', () => {
    expect(extractMeetUrl({})).toBeUndefined();
  });

  it('ignores video entry points that lack a URI', () => {
    const event: calendar_v3.Schema$Event = {
      conferenceData: {
        entryPoints: [{ entryPointType: 'video' }],
      },
    };
    expect(extractMeetUrl(event)).toBeUndefined();
  });
});
