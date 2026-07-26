import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextPlugin from '@next/eslint-plugin-next';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default defineConfig([
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@next/next': nextPlugin,
      'jsx-a11y': jsxA11y,
      react,
      'react-hooks': reactHooks,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      'react/prop-types': 'off',
      // Dette historique : ces regles restent visibles sans bloquer la chaine.
      // Les erreurs structurelles React/Next et les regles des hooks restent bloquantes.
      'no-empty': 'warn',
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      'no-useless-escape': 'warn',
      'react/no-unescaped-entities': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
      'react/display-name': 'warn',
      '@next/next/no-html-link-for-pages': 'warn',
    },
  },
  {
    files: [
      'functions/src/commerce/**/*.{js,cjs,mjs}',
      'functions/src/email/**/*.{js,cjs,mjs}',
      'functions/src/maintenance/**/*.{js,cjs,mjs}',
      'tests/commerce/**/*.cjs',
    ],
    languageOptions: {
      sourceType: 'commonjs',
    },
    rules: {
      'no-empty': 'error',
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      'no-useless-escape': 'error',
    },
  },
  globalIgnores([
    '.next/**',
    '_DOCS/**',
    'docs/**',
    'dist/**',
    'functions/helpers/**',
    'functions/index.js',
    'functions/src/analytics/**',
    'functions/src/auth/**',
    'functions/src/catalog/**',
    'functions/src/onboarding/**',
    'functions/src/triggers/**',
    'node_modules/**',
    'out/**',
    'scripts/**',
    'test-results/**',
    'playwright-report/**'
  ])
]);
