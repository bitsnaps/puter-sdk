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
    exclude:[
      ...configDefaults.exclude, 
      'examples/*'
    ]
  },
});
