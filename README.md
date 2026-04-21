# Meet Dashboard

A web app that mimics the Google Meet Hardware home screen: shows the room's
upcoming meetings, current time, and lets you join an ad-hoc meeting by code.
Designed to run as a kiosk (fullscreen Chrome on a Raspberry Pi, NUC, etc.)
pinned to one Google Workspace **Calendar Resource** ("Room").

## Architecture

- **Backend** — small Fastify + TypeScript service. Holds one Google OAuth
  refresh token, calls Google Calendar API for each configured room, exposes
  a tiny JSON API.
- **Frontend** — React + TypeScript built with **rsbuild**. Polls the backend
  every 30s. Opens `meet.google.com/{code}` in a new tab to join.
- **Auth model** — one dedicated "kiosk reader" Workspace user with read access
  to each room's resource calendar. One refresh token in `.env`. No
  Domain-Wide Delegation needed.

## One-time setup

### 1. Google Cloud project

1. Create a project at <https://console.cloud.google.com/>.
2. Enable **Google Calendar API**.
3. Configure the OAuth consent screen as **Internal** (Workspace org only).
4. Create credentials → **OAuth client ID** → application type **Desktop app**.
5. Note the client ID and client secret.

### 2. Kiosk reader account

Designate one Workspace user account that will own the OAuth grant. It needs
**read access to every room calendar** the kiosk fleet displays.

For each Calendar Resource (Admin console → Buildings & resources):

- Either rely on the org-default sharing setting that exposes event details
  to all members, or
- Open the resource calendar in Calendar UI as an admin → Settings → "Share
  with specific people" → add the kiosk reader with **See all event details**.

### 3. Environment variables

Create a `.env` file in the project root with:

```
GOOGLE_CLIENT_ID=<from step 1>
GOOGLE_CLIENT_SECRET=<from step 1>
GOOGLE_REFRESH_TOKEN=<filled in by step 4>
PORT=8337

# Optional: nature/landscape background photo from Unsplash.
# Sign up at https://unsplash.com/developers, create an app, copy the
# "Access Key" (NOT the Secret Key). Free tier: 50 requests/hour, which
# is plenty since the backend caches each photo for 30 minutes.
# When unset, the kiosk shows a flat dark background.
UNSPLASH_ACCESS_KEY=

# Optional override:
# ROOMS_CONFIG_PATH=./config/rooms.json
```

### 4. Obtain the refresh token

```
npm install
npm run auth
```

A browser window opens. **Sign in as the kiosk reader account** and approve
the Calendar read scope. The script prints the refresh token; paste it into
`.env` as `GOOGLE_REFRESH_TOKEN`.

### 5. Configure rooms

Copy the example and fill in real Calendar Resource IDs:

```
cp config/rooms.example.json config/rooms.json
```

Each entry needs:

- `id` — short slug, used in URLs (`/?roomId=aurora`)
- `displayName` — shown on the kiosk
- `calendarId` — the resource calendar ID, e.g.
  `c_188xxxxxxxxxx@resource.calendar.google.com`. Find these in
  Admin console → Buildings & resources → click a room → **Calendar resource ID**.

## Running

### UI-only mock mode (no backend, no Google credentials)

For iterating on the UI before any of the Google setup is wired up:

```
npm run dev:mock
```

This runs only the rsbuild dev server (default port `3000`). All API calls are
short-circuited to canned data anchored to the current time — one event running
right now, a few upcoming, one private, one without a Meet link, plus a
deliberately long title for layout testing. Open
`http://localhost:3000/?roomId=aurora`.

Mock data lives in `src/web/mockData.ts` — tweak it to exercise different UI
states (including a placeholder Unsplash background photo). The mock module
is tree-shaken out of any non-mock build, so it never ships to production.

### Development (full stack, hot reload, separate ports)

```
npm run dev
```

This runs the backend on `http://localhost:8337` and the rsbuild dev server on
`http://localhost:3000` with `/api` proxied to the backend.

Open `http://localhost:3000/?roomId=aurora` (substitute one of your room ids).

### Production (single process, no Docker)

```
npm run build
npm run start
```

The backend serves the built bundle from `dist/web/` and the API from the same
port. Open `http://<host>:8337/?roomId=aurora`.

### Production (Docker Compose)

Make sure `.env` and `config/rooms.json` are in place, then:

```
docker compose up -d
```

This builds a multi-stage image (build deps stay out of the final layer),
starts the server on port `8337` (configurable via `PORT` in `.env`), and
mounts `rooms.json` read-only. The container restarts automatically unless
you explicitly stop it.

To rebuild after code changes:

```
docker compose up -d --build
```

### Kiosk launch

Point fullscreen Chrome at the URL with a per-device room id:

```
chromium-browser --kiosk --noerrdialogs --disable-infobars \
  http://meet-dashboard.local:8337/?roomId=aurora
```

## Testing

```
npm test            # one-shot
npm run test:watch  # watch mode
npm run typecheck   # tsc on web + server projects
```

## File layout

```
src/
  shared/      types + meet-code helpers shared by web and server
  server/      Fastify backend, Google client, cache, routes
  web/         React kiosk UI (rsbuild entry: src/web/index.tsx)
  test/        vitest setup
scripts/
  obtain-refresh-token.ts   one-time OAuth bootstrap
config/
  rooms.example.json
public/
  index.html   rsbuild template
```

## Scaling later

If/when this needs to cover many rooms across a large org, swap the OAuth
client in `src/server/google.ts` for a `JWT` client with `subject:` user
impersonation (Domain-Wide Delegation). The `CalendarReader` interface stays
identical, so route code is untouched.

## Non-goals

- **No in-page Meet embed.** Google does not offer a web SDK to render a Meet
  call inside another page. Real Meet Hardware uses proprietary client
  software. Joining opens `meet.google.com/{code}` in a new tab.
- No multi-tenant SaaS, admin UI, or calendar mutation. Read-only and
  single-org.
- No viewer authentication; the kiosk is assumed to be on a trusted local
  network.
