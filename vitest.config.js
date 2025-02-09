import { defineConfig, configDefaults } from 'vitest/config';
import path from 'path';

export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './tests'),
    },
  },
  test: {
    environment: 'node',
    include: ['**/*.test.js', '**/*.test.ts'],
    exclude:[
      ...configDefaults.exclude, 
      'examples',
      'tests/integrations/*' // temporary disabled
    ],
    coverage: {
      provider: 'v8',
      reporter: ['html','text'],
      threshold: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100
      }
    }
  },
});
