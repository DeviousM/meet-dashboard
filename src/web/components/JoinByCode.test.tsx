import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { JoinByCode } from './JoinByCode';

describe('JoinByCode', () => {
  const openSpy = vi.fn();

  beforeEach(() => {
    openSpy.mockReset();
    vi.stubGlobal('open', openSpy);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens the Meet URL on submit with a valid code', () => {
    render(<JoinByCode />);
    const input = screen.getByPlaceholderText('abc-defg-hij');
    fireEvent.change(input, { target: { value: 'abc-defg-hij' } });
    fireEvent.click(screen.getByRole('button', { name: 'Join' }));
    expect(openSpy).toHaveBeenCalledWith(
      'https://meet.google.com/abc-defg-hij',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('disables the join button until the code is valid', () => {
    render(<JoinByCode />);
    const button = screen.getByRole('button', { name: 'Join' });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText('abc-defg-hij'), {
      target: { value: 'abc-defg-hij' },
    });
    expect(button).not.toBeDisabled();
  });

  it('marks the input invalid after blur with bad code', () => {
    render(<JoinByCode />);
    const input = screen.getByPlaceholderText('abc-defg-hij');
    fireEvent.change(input, { target: { value: 'nope' } });
    fireEvent.blur(input);
    expect(input.className).toContain('join__input--invalid');
  });

  it('clears the field after a successful submit', () => {
    render(<JoinByCode />);
    const input = screen.getByPlaceholderText(
      'abc-defg-hij',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'abc-defg-hij' } });
    fireEvent.click(screen.getByRole('button', { name: 'Join' }));
    expect(input.value).toBe('');
  });
});
