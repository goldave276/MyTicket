import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Evite le parcours parent hors workspace sur Windows Sandbox lorsque jsdom est bien present localement.
if (fs.existsSync(path.join(__dirname, 'node_modules', 'jsdom'))) {
  process.env.VITEST_SKIP_INSTALL_CHECKS = '1';
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/__tests__/**/*.test.{js,jsx}'],
  },
});
