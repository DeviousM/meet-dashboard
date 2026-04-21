import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { RoomDto } from '../shared/types.js';

export interface RoomConfig extends RoomDto {
  readonly calendarId: string;
}

export interface AppConfig {
  readonly rooms: readonly RoomConfig[];
  readonly google: {
    readonly clientId: string;
    readonly clientSecret: string;
    readonly refreshToken: string;
  };
  readonly unsplash: {
    readonly accessKey: string | null;
  };
  readonly port: number;
  readonly webDistPath: string;
}

const DEFAULT_ROOMS_PATH = './config/rooms.json';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseRooms(json: string): readonly RoomConfig[] {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch (err) {
    throw new Error(
      `rooms config is not valid JSON: ${(err as Error).message}`,
    );
  }
  if (!Array.isArray(raw)) {
    throw new Error('rooms config must be a JSON array');
  }
  return raw.map((entry, index): RoomConfig => {
    if (typeof entry !== 'object' || entry === null) {
      throw new Error(`rooms[${index}] is not an object`);
    }
    const obj = entry as Record<string, unknown>;
    const id = obj['id'];
    const displayName = obj['displayName'];
    const calendarId = obj['calendarId'];
    if (typeof id !== 'string' || id.length === 0) {
      throw new Error(`rooms[${index}].id must be a non-empty string`);
    }
    if (typeof displayName !== 'string' || displayName.length === 0) {
      throw new Error(`rooms[${index}].displayName must be a non-empty string`);
    }
    if (typeof calendarId !== 'string' || calendarId.length === 0) {
      throw new Error(`rooms[${index}].calendarId must be a non-empty string`);
    }
    return { id, displayName, calendarId };
  });
}

export function loadConfig(): AppConfig {
  const roomsPath = resolve(
    process.cwd(),
    process.env['ROOMS_CONFIG_PATH'] ?? DEFAULT_ROOMS_PATH,
  );
  let roomsJson: string;
  try {
    roomsJson = readFileSync(roomsPath, 'utf8');
  } catch (err) {
    throw new Error(
      `Could not read rooms config at ${roomsPath}: ${(err as Error).message}`,
    );
  }
  const rooms = parseRooms(roomsJson);
  if (rooms.length === 0) {
    throw new Error('rooms config must contain at least one room');
  }
  const ids = new Set<string>();
  for (const r of rooms) {
    if (ids.has(r.id)) {
      throw new Error(`Duplicate room id: ${r.id}`);
    }
    ids.add(r.id);
  }

  const unsplashKey = process.env['UNSPLASH_ACCESS_KEY'];
  return {
    rooms,
    google: {
      clientId: requireEnv('GOOGLE_CLIENT_ID'),
      clientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
      refreshToken: requireEnv('GOOGLE_REFRESH_TOKEN'),
    },
    unsplash: {
      accessKey:
        unsplashKey !== undefined && unsplashKey.trim() !== ''
          ? unsplashKey.trim()
          : null,
    },
    port: Number(process.env['PORT'] ?? 8787),
    webDistPath: resolve(process.cwd(), 'dist/web'),
  };
}
