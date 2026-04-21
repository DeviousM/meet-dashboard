import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

const SERVER_PORT = Number(process.env.PORT) || 8787;
const DEV_PORT = Number(process.env.WEB_PORT) || 3000;
const MOCK_MODE = process.env.MOCK_MODE === '1';

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {
      index: './src/web/index.tsx',
    },
    define: {
      __MOCK_MODE__: JSON.stringify(MOCK_MODE),
    },
  },
  html: {
    template: './public/index.html',
  },
  output: {
    distPath: {
      root: 'dist/web',
    },
    cleanDistPath: true,
  },
  server: {
    port: DEV_PORT,
    proxy: {
      '/api': `http://localhost:${SERVER_PORT}`,
      '/healthz': `http://localhost:${SERVER_PORT}`,
    },
  },
});
