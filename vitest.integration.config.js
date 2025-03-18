import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

export default defineConfig({
    plugins: [],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@test': path.resolve(__dirname, './tests'),
      },
    },
  test: {
    include: ['tests/integration/**/*.test.js'],
    testTimeout: 30000, // Longer timeout for integration tests
    environmentMatchGlobs: [
      ['tests/integration/**', 'node'] // Ensure Node environment
    ],
  },
  // Specific setup goes here
})