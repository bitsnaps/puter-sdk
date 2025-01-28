import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    // setupFiles: ['./tests/setup.js'], // removed to keep it simple
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
    }
  }
});