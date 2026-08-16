import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'

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
      'public/mockServiceWorker.js',
      'playwright-report/**',
      'test-results/**',
      '*.config.ts',
      '*.config.js',
      '*.config.mjs',
    ],
  },
]

export default eslintConfig
