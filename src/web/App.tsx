import { useEffect, useState } from 'react';
import type { RoomDto } from '../shared/types';
import { fetchRooms } from './api';
import { Background } from './components/Background';
import { RoomHeader } from './components/RoomHeader';
import { EventList } from './components/EventList';
import { JoinByCode } from './components/JoinByCode';

function getRoomIdFromLocation(): string | null {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('roomId');
  if (fromQuery !== null && fromQuery.length > 0) return fromQuery;
  // Allow build-time pin via rsbuild's `define` (see rsbuild.config.ts).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baked = (globalThis as any).__KIOSK_ROOM_ID__;
  return typeof baked === 'string' && baked.length > 0 ? baked : null;
}

type State =
  | { kind: 'loading' }
  | { kind: 'no-room'; rooms: readonly RoomDto[] }
  | { kind: 'ready'; room: RoomDto }
  | { kind: 'error'; message: string };

export function App(): JSX.Element {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rooms = await fetchRooms();
        if (cancelled) return;
        const wantedId = getRoomIdFromLocation();
        const room =
          wantedId === null ? undefined : rooms.find((r) => r.id === wantedId);
        if (room === undefined) {
          setState({ kind: 'no-room', rooms });
        } else {
          setState({ kind: 'ready', room });
        }
      } catch (err) {
        if (!cancelled)
          setState({ kind: 'error', message: (err as Error).message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === 'loading') {
    return <div className="app">Loading…</div>;
  }
  if (state.kind === 'error') {
    return (
      <div className="app">
        <div className="error-banner">{state.message}</div>
      </div>
    );
  }
  if (state.kind === 'no-room') {
    return (
      <div className="app">
        <header className="header">
          <div className="header__room">Pick a room</div>
        </header>
        <div className="events">
          {state.rooms.map((r) => (
            <a
              key={r.id}
              href={`/?roomId=${encodeURIComponent(r.id)}`}
              className="event"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="event__details">
                <div className="event__title">{r.displayName}</div>
                <div className="event__organizer">{r.id}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <Background />
      <div className="app">
        <RoomHeader displayName={state.room.displayName} />
        <EventList roomId={state.room.id} />
        <JoinByCode />
      </div>
    </>
  );
}
