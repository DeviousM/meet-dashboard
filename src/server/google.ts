import { google, type calendar_v3 } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import type { EventDto } from '../shared/types.js';
import { extractMeetUrl } from './meet-url.js';

export interface GoogleCredentials {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly refreshToken: string;
}

const LOOKAHEAD_MS = 24 * 60 * 60 * 1000;
const MAX_RESULTS = 25;

export interface CalendarReader {
  listUpcomingEvents(calendarId: string): Promise<readonly EventDto[]>;
}

function createOAuthClient(creds: GoogleCredentials): OAuth2Client {
  const client = new google.auth.OAuth2({
    clientId: creds.clientId,
    clientSecret: creds.clientSecret,
  });
  client.setCredentials({ refresh_token: creds.refreshToken });
  return client;
}

function isPrivate(event: calendar_v3.Schema$Event): boolean {
  return event.visibility === 'private' || event.visibility === 'confidential';
}

function toEventDto(event: calendar_v3.Schema$Event): EventDto | null {
  const start = event.start?.dateTime ?? event.start?.date;
  const end = event.end?.dateTime ?? event.end?.date;
  if (!event.id || !start || !end) {
    return null;
  }
  const priv = isPrivate(event);
  if (priv) {
    return {
      id: event.id,
      title: 'Busy',
      startTime: start,
      endTime: end,
      isPrivate: true,
    };
  }
  const organizer =
    event.organizer?.displayName ?? event.organizer?.email ?? undefined;
  return {
    id: event.id,
    title: event.summary ?? '(No title)',
    startTime: start,
    endTime: end,
    isPrivate: false,
    organizer,
    meetUrl: extractMeetUrl(event),
  };
}

export function createCalendarReader(
  creds: GoogleCredentials,
): CalendarReader {
  const auth = createOAuthClient(creds);
  const calendar = google.calendar({ version: 'v3', auth });

  return {
    async listUpcomingEvents(calendarId: string): Promise<readonly EventDto[]> {
      const now = Date.now();
      const response = await calendar.events.list({
        calendarId,
        timeMin: new Date(now).toISOString(),
        timeMax: new Date(now + LOOKAHEAD_MS).toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: MAX_RESULTS,
      });
      const items = response.data.items ?? [];
      const dtos: EventDto[] = [];
      for (const item of items) {
        // Skip events the room declined or cancelled.
        if (item.status === 'cancelled') continue;
        const dto = toEventDto(item);
        if (dto !== null) dtos.push(dto);
      }
      return dtos;
    },
  };
}

export class GoogleAuthError extends Error {
  override readonly name = 'GoogleAuthError';
}

export function classifyGoogleError(err: unknown): {
  status: number;
  code: string;
  message: string;
} {
  const e = err as { code?: number | string; message?: string };
  const message = e.message ?? 'Unknown Google API error';
  if (typeof message === 'string' && message.includes('invalid_grant')) {
    return {
      status: 503,
      code: 'reauth_required',
      message:
        'Google refresh token was rejected. Re-run `npm run auth` to obtain a new token.',
    };
  }
  const numericCode = typeof e.code === 'number' ? e.code : undefined;
  if (numericCode === 401 || numericCode === 403) {
    return { status: numericCode, code: 'forbidden', message };
  }
  if (numericCode === 404) {
    return {
      status: 404,
      code: 'calendar_not_found',
      message: 'Calendar not found or kiosk reader has no access',
    };
  }
  return { status: 502, code: 'google_api_error', message };
}
