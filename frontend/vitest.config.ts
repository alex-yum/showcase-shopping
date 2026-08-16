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
      // `include` + `all: true` (the v8 default) makes untested source files
      // show up as 0% instead of being invisible to the coverage report.
      include: [
        'app/**/*.{ts,tsx}',
        'components/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}',
      ],
      exclude: [
        'node_modules/',
        'vitest.setup.ts',
        '**/*.config.*',
        '**/*.d.ts',
        '**/mocks/**',
        'e2e/**',
        'app/layout.tsx',
        'app/(auth)/layout.tsx',
        'app/(dashboard)/layout.tsx',
        // Type-only files with no runtime code (interfaces/types erase at compile time)
        'lib/types/**',
      ],
      thresholds: {
        lines: 90,
        functions: 85,
        branches: 85,
        statements: 90,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
