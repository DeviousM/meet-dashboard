import type { EventDto } from '../../shared/types';

interface EventCardProps {
  readonly event: EventDto;
  readonly now: Date;
}

const TIME_FMT = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function formatRange(startIso: string, endIso: string): string {
  return `${TIME_FMT.format(new Date(startIso))} – ${TIME_FMT.format(new Date(endIso))}`;
}

function isCurrent(event: EventDto, now: Date): boolean {
  const start = new Date(event.startTime).getTime();
  const end = new Date(event.endTime).getTime();
  const t = now.getTime();
  return t >= start && t < end;
}

function durationLabel(event: EventDto, now: Date): string {
  const start = new Date(event.startTime).getTime();
  const diffMin = Math.round((start - now.getTime()) / 60_000);
  if (diffMin < 0) return 'Now';
  if (diffMin < 60) return `In ${diffMin} min`;
  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  return mins === 0 ? `In ${hours}h` : `In ${hours}h ${mins}m`;
}

function openMeet(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function EventCard({ event, now }: EventCardProps): JSX.Element {
  const current = isCurrent(event, now);
  return (
    <div className={`event${current ? ' event--current' : ''}`}>
      <div className="event__time">
        <div>{formatRange(event.startTime, event.endTime)}</div>
        <div className="event__time-secondary">{durationLabel(event, now)}</div>
      </div>
      <div className="event__details">
        <div className="event__title">{event.title}</div>
        {event.organizer !== undefined && (
          <div className="event__organizer">{event.organizer}</div>
        )}
      </div>
      <button
        type="button"
        className="button"
        disabled={event.meetUrl === undefined}
        onClick={() => event.meetUrl !== undefined && openMeet(event.meetUrl)}
      >
        Join
      </button>
    </div>
  );
}
