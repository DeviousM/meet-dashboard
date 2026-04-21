import 'dotenv/config';
import { existsSync } from 'node:fs';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { loadConfig } from './config.js';
import { createCalendarReader } from './google.js';
import { createUnsplashProvider } from './unsplash.js';
import { registerRoutes } from './routes.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const reader = createCalendarReader(config.google);
  const background =
    config.unsplash.accessKey === null
      ? null
      : createUnsplashProvider({ accessKey: config.unsplash.accessKey });

  const app = Fastify({
    logger: {
      level: process.env['LOG_LEVEL'] ?? 'info',
    },
  });

  await registerRoutes(app, { config, reader, background });

  // Serve the built web bundle in production. In dev the rsbuild server
  // proxies /api to this backend instead.
  if (existsSync(config.webDistPath)) {
    await app.register(fastifyStatic, {
      root: config.webDistPath,
      prefix: '/',
    });
  } else {
    app.log.info(
      `Web dist not found at ${config.webDistPath}; backend running in API-only mode`,
    );
  }

  await app.listen({ host: '0.0.0.0', port: config.port });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Server failed to start:', err);
  process.exit(1);
});
