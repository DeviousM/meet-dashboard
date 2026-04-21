/**
 * One-time CLI: runs an OAuth Installed-App loopback flow, prints the
 * resulting refresh token. Sign in as the kiosk-reader Workspace user.
 *
 *   1. Fill GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in .env (Desktop client).
 *   2. npm run auth
 *   3. Browser opens; consent as kiosk reader.
 *   4. Refresh token is printed; paste into .env as GOOGLE_REFRESH_TOKEN.
 */
import 'dotenv/config';
import http from 'node:http';
import { URL } from 'node:url';
import open from 'open';
import { google } from 'googleapis';

const PORT = 53682;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} in .env`);
  return v;
}

async function main(): Promise<void> {
  const clientId = requireEnv('GOOGLE_CLIENT_ID');
  const clientSecret = requireEnv('GOOGLE_CLIENT_SECRET');

  const oauth2 = new google.auth.OAuth2({
    clientId,
    clientSecret,
    redirectUri: REDIRECT_URI,
  });

  const authUrl = oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });

  const refreshToken = await new Promise<string>((resolvePromise, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        if (!req.url) {
          res.statusCode = 400;
          res.end('No URL');
          return;
        }
        const url = new URL(req.url, `http://localhost:${PORT}`);
        if (url.pathname !== '/oauth2callback') {
          res.statusCode = 404;
          res.end('Not found');
          return;
        }
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');
        if (error) {
          res.statusCode = 400;
          res.end(`OAuth error: ${error}`);
          server.close();
          reject(new Error(`OAuth error: ${error}`));
          return;
        }
        if (!code) {
          res.statusCode = 400;
          res.end('Missing code');
          return;
        }
        const { tokens } = await oauth2.getToken(code);
        res.setHeader('content-type', 'text/html; charset=utf-8');
        res.end(
          '<html><body><h1>Done — you can close this tab.</h1></body></html>',
        );
        server.close();
        if (!tokens.refresh_token) {
          reject(
            new Error(
              'No refresh_token returned. Revoke the app at myaccount.google.com and try again.',
            ),
          );
          return;
        }
        resolvePromise(tokens.refresh_token);
      } catch (err) {
        reject(err);
      }
    });
    server.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Waiting for OAuth callback on ${REDIRECT_URI}`);
      void open(authUrl);
    });
  });

  // eslint-disable-next-line no-console
  console.log('\n========== REFRESH TOKEN ==========');
  // eslint-disable-next-line no-console
  console.log(refreshToken);
  // eslint-disable-next-line no-console
  console.log('===================================\n');
  // eslint-disable-next-line no-console
  console.log('Add this to .env as GOOGLE_REFRESH_TOKEN.');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
