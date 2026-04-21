import { useState, type FormEvent } from 'react';
import { meetUrlFromCode, normalizeMeetCode } from '../../shared/meetCode';

export function JoinByCode(): JSX.Element {
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);

  const trimmed = value.trim();
  const isValid = trimmed.length === 0 || normalizeMeetCode(trimmed) !== null;
  const url = meetUrlFromCode(trimmed);

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();
    setTouched(true);
    if (url === null) return;
    window.open(url, '_blank', 'noopener,noreferrer');
    setValue('');
    setTouched(false);
  };

  return (
    <form className="join" onSubmit={handleSubmit}>
      <label className="join__label" htmlFor="meet-code">
        Join with a code:
      </label>
      <input
        id="meet-code"
        className={`join__input${!isValid && touched ? ' join__input--invalid' : ''}`}
        type="text"
        autoComplete="off"
        spellCheck={false}
        placeholder="abc-defg-hij"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (touched) setTouched(false);
        }}
        onBlur={() => setTouched(true)}
      />
      <button type="submit" className="button" disabled={url === null}>
        Join
      </button>
    </form>
  );
}
