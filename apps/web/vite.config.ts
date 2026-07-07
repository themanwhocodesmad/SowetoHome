import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  // Reads the repo-root .env (same file apps/api and apps/worker use) instead of a
  // separate apps/web/.env, so there is one source of truth. Only VITE_-prefixed keys
  // in it are ever exposed to client code, per Vite's own safety rule.
  envDir: path.resolve(__dirname, '../../'),
  server: {
    port: 5173,
  },
});
