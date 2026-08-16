import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import testingLibrary from 'eslint-plugin-testing-library'
import jestDom from 'eslint-plugin-jest-dom'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      '.next/**',
      'out/**',
      'node_modules/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      '*.config.ts',
      '*.config.js',
      '*.config.mjs',
      'scripts/**',
    ],
  },
  {
    files: ['__tests__/**/*.{ts,tsx}'],
    plugins: {
      'testing-library': testingLibrary,
      'jest-dom': jestDom,
    },
    rules: {
      'testing-library/no-await-sync-events': 'error',
      'testing-library/no-unnecessary-act': 'error',
      'testing-library/prefer-screen-queries': 'error',
      'testing-library/no-render-in-lifecycle': 'error',
      'jest-dom/prefer-to-have-value': 'error',
      'jest-dom/prefer-in-document': 'error',
    },
  },
]

export default eslintConfig
