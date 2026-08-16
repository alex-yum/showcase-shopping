import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        '.next/**',
        'coverage/**',
        'public/mockServiceWorker.js',
        '__tests__/**',
        '**/*.test.*',
        '**/*.spec.*',
        'vitest.setup.ts',
        '**/*.config.*',
        '**/*.d.ts',
        '**/mocks/**',
        'e2e/**',
        'lib/types/**',
      ],
      // MVP-phase thresholds (2026-05-30)
      // Core logic (auth, API) has >90% coverage
      // UI components have basic coverage
      // Plan: increase to 90%+ post-MVP
      // See CONTRIBUTING.md for rationale
      thresholds: {
        lines: 80,
        functions: 70,
        branches: 75,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
