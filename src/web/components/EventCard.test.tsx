import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EventCard } from './EventCard';
import type { EventDto } from '../../shared/types';

const baseEvent: EventDto = {
  id: 'e1',
  title: 'Q2 planning',
  startTime: '2026-04-13T15:00:00Z',
  endTime: '2026-04-13T15:30:00Z',
  meetUrl: 'https://meet.google.com/abc-defg-hij',
  isPrivate: false,
  organizer: 'Maria',
};

describe('EventCard', () => {
  const openSpy = vi.fn();

  beforeEach(() => {
    openSpy.mockReset();
    vi.stubGlobal('open', openSpy);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens the Meet URL when Join is clicked', () => {
    render(<EventCard event={baseEvent} now={new Date('2026-04-13T14:00:00Z')} />);
    fireEvent.click(screen.getByRole('button', { name: 'Join' }));
    expect(openSpy).toHaveBeenCalledWith(
      baseEvent.meetUrl,
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('disables Join when no Meet URL is present', () => {
    const event = { ...baseEvent, meetUrl: undefined } satisfies EventDto;
    render(<EventCard event={event} now={new Date('2026-04-13T14:00:00Z')} />);
    expect(screen.getByRole('button', { name: 'Join' })).toBeDisabled();
  });

  it('shows organizer name', () => {
    render(<EventCard event={baseEvent} now={new Date('2026-04-13T14:00:00Z')} />);
    expect(screen.getByText('Maria')).toBeInTheDocument();
  });

  it('marks the card as current when now is inside the event window', () => {
    const { container } = render(
      <EventCard event={baseEvent} now={new Date('2026-04-13T15:10:00Z')} />,
    );
    expect(container.querySelector('.event--current')).not.toBeNull();
  });
});
