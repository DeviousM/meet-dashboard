import { useEffect, useState } from 'react';
import type { EventsResponse } from '../../shared/types';
import { fetchEvents } from '../api';
import { EventCard } from './EventCard';

interface EventListProps {
  readonly roomId: string;
  readonly pollIntervalMs?: number;
}

const DEFAULT_POLL_MS = 30_000;

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; data: EventsResponse }
  | { kind: 'error'; message: string };

export function EventList({
  roomId,
  pollIntervalMs = DEFAULT_POLL_MS,
}: EventListProps): JSX.Element {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const data = await fetchEvents(roomId);
        if (!cancelled) setState({ kind: 'ready', data });
      } catch (err) {
        if (!cancelled)
          setState({ kind: 'error', message: (err as Error).message });
      }
    };
    void load();
    const id = window.setInterval(load, pollIntervalMs);
    const onVisible = (): void => {
      if (document.visibilityState === 'visible') void load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [roomId, pollIntervalMs]);

  // Tick "now" once a minute so duration labels and current-event highlight
  // stay accurate without re-fetching events.
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  if (state.kind === 'loading') {
    return <div className="events__empty">Loading…</div>;
  }
  if (state.kind === 'error') {
    return (
      <div className="events__empty">
        <div className="events__empty-title">Couldn't load events</div>
        <div className="error-banner">{state.message}</div>
      </div>
    );
  }
  if (state.data.events.length === 0) {
    return (
      <div className="events__empty">
        <div className="events__empty-title">No upcoming meetings</div>
        <div>Enjoy the quiet, or join with a code below.</div>
      </div>
    );
  }
  return (
    <div className="events">
      {state.data.events.map((e) => (
        <EventCard key={e.id} event={e} now={now} />
      ))}
    </div>
  );
}
