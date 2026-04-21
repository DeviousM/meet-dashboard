import { useEffect, useState } from 'react';

interface ClockProps {
  readonly now?: Date;
}

const TIME_FMT = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const DATE_FMT = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

export function Clock({ now: initial }: ClockProps): JSX.Element {
  const [now, setNow] = useState<Date>(() => initial ?? new Date());
  useEffect(() => {
    if (initial !== undefined) return;
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [initial]);

  return (
    <div>
      <span className="header__clock">{TIME_FMT.format(now)}</span>
      <span className="header__date">{DATE_FMT.format(now)}</span>
    </div>
  );
}
