import type {
  BackgroundDto,
  EventsResponse,
  RoomDto,
} from '../shared/types';
import {
  mockFetchBackground,
  mockFetchEvents,
  mockFetchRooms,
} from './mockData';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    let detail = '';
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      detail = body.error?.message ?? '';
    } catch {
      // ignore
    }
    throw new Error(
      detail || `Request to ${url} failed with status ${res.status}`,
    );
  }
  return (await res.json()) as T;
}

export function fetchRooms(): Promise<readonly RoomDto[]> {
  if (__MOCK_MODE__) return mockFetchRooms();
  return fetchJson<readonly RoomDto[]>('/api/rooms');
}

export function fetchEvents(roomId: string): Promise<EventsResponse> {
  if (__MOCK_MODE__) return mockFetchEvents(roomId);
  return fetchJson<EventsResponse>(
    `/api/rooms/${encodeURIComponent(roomId)}/events`,
  );
}

/**
 * Returns the current background image, or null if the backend is not
 * configured for backgrounds (e.g. UNSPLASH_ACCESS_KEY missing) or the
 * upstream fetch failed. Callers should treat null as "show the flat
 * fallback background — no error to display."
 */
export async function fetchBackground(): Promise<BackgroundDto | null> {
  if (__MOCK_MODE__) return mockFetchBackground();
  try {
    const res = await fetch('/api/background', {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as BackgroundDto;
  } catch {
    return null;
  }
}
