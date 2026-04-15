import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Config de integração — roda APENAS em CI (GitHub Actions services
 * provisionam Postgres+pgvector e MinIO). Localmente é skippado para
 * evitar dependência de Docker no loop de dev.
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/__tests__/integration/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    // Localmente não existe esses services — pulamos via env guard
    // dentro de cada describe usando `describe.skipIf(!process.env.CI)`.
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
