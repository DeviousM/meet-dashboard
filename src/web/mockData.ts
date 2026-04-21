import type {
  BackgroundDto,
  EventDto,
  EventsResponse,
  RoomDto,
} from '../shared/types';

const MOCK_ROOMS: readonly RoomDto[] = [
  { id: 'aurora', displayName: 'Conference Room Aurora' },
  { id: 'borealis', displayName: 'Conference Room Borealis' },
];

function isoFromOffset(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

/**
 * Build a fresh mock events payload anchored to "now" so the dashboard
 * shows a realistic mix of currently-running, near-future, and far-future
 * meetings every time the page is loaded or polled.
 */
function buildMockEvents(roomId: string): EventsResponse {
  const events: readonly EventDto[] = [
    {
      id: 'evt-now',
      title: 'Daily standup',
      organizer: 'Maria Kowalska',
      startTime: isoFromOffset(-10),
      endTime: isoFromOffset(20),
      meetUrl: 'https://meet.google.com/abc-defg-hij',
      isPrivate: false,
    },
    {
      id: 'evt-soon',
      title: 'Design review — Meet Dashboard kiosk',
      organizer: 'Tomasz Nowak',
      startTime: isoFromOffset(45),
      endTime: isoFromOffset(105),
      meetUrl: 'https://meet.google.com/xyz-uvwq-rst',
      isPrivate: false,
    },
    {
      id: 'evt-no-meet',
      title: 'Coffee chat (in person)',
      organizer: 'Anna Wiśniewska',
      startTime: isoFromOffset(150),
      endTime: isoFromOffset(180),
      isPrivate: false,
    },
    {
      id: 'evt-private',
      title: 'should-be-hidden',
      startTime: isoFromOffset(240),
      endTime: isoFromOffset(270),
      isPrivate: true,
    },
    {
      id: 'evt-long-title',
      title:
        'Quarterly all-hands with very very very very very very long title that should ellipsize',
      organizer: 'CEO Office',
      startTime: isoFromOffset(330),
      endTime: isoFromOffset(390),
      meetUrl: 'https://meet.google.com/lmn-opqr-stu',
      isPrivate: false,
    },
  ];

  // Private events are surfaced to the UI with title "Busy" — match what the
  // server would emit so the frontend renders the same shape.
  const sanitized = events.map((e): EventDto =>
    e.isPrivate ? { ...e, title: 'Busy' } : e,
  );

  return {
    roomId,
    fetchedAt: new Date().toISOString(),
    events: sanitized,
  };
}

const MOCK_LATENCY_MS = 200;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

export function mockFetchRooms(): Promise<readonly RoomDto[]> {
  return delay(MOCK_ROOMS);
}

export function mockFetchEvents(roomId: string): Promise<EventsResponse> {
  return delay(buildMockEvents(roomId));
}

const MOCK_BACKGROUND: BackgroundDto = {
  // Static, well-known Unsplash photo (Bailey Zindel — mountain landscape).
  // Hot-linked via Unsplash CDN, used here only for local mock-mode preview.
  url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=80&auto=format&fit=crop',
  photographer: 'Bailey Zindel',
  photographerUrl:
    'https://unsplash.com/@baileyzindel?utm_source=meet-dashboard&utm_medium=referral',
  photoPageUrl:
    'https://unsplash.com/photos/NRQV-hBF10M?utm_source=meet-dashboard&utm_medium=referral',
  color: '#26261c',
  refreshAt: new Date(Date.now() + 30 * 60_000).toISOString(),
};

export function mockFetchBackground(): Promise<BackgroundDto | null> {
  return delay(MOCK_BACKGROUND);
}
