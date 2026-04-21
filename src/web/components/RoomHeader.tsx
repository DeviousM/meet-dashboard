import { Clock } from './Clock';

interface RoomHeaderProps {
  readonly displayName: string;
}

export function RoomHeader({ displayName }: RoomHeaderProps): JSX.Element {
  return (
    <header className="header">
      <div className="header__room">{displayName}</div>
      <Clock />
    </header>
  );
}
