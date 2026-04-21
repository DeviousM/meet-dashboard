import { describe, expect, it } from 'vitest';
import { meetUrlFromCode, normalizeMeetCode } from './meetCode';

describe('normalizeMeetCode', () => {
  it.each([
    ['abc-defg-hij', 'abc-defg-hij'],
    ['ABC-DEFG-HIJ', 'abc-defg-hij'],
    ['  abc-defg-hij  ', 'abc-defg-hij'],
    ['abc - defg - hij', 'abc-defg-hij'],
  ])('accepts %j → %j', (input, expected) => {
    expect(normalizeMeetCode(input)).toBe(expected);
  });

  it.each([
    '',
    'abc-defg-hi',
    'abc-defg-hijk',
    'abcdefghij',
    'abc-defg-hi1',
    'abc/defg/hij',
    'too-many-parts-here',
  ])('rejects %j', (input) => {
    expect(normalizeMeetCode(input)).toBeNull();
  });
});

describe('meetUrlFromCode', () => {
  it('builds the URL for a valid code', () => {
    expect(meetUrlFromCode('abc-defg-hij')).toBe(
      'https://meet.google.com/abc-defg-hij',
    );
  });

  it('returns null for an invalid code', () => {
    expect(meetUrlFromCode('not-a-code')).toBeNull();
  });
});
