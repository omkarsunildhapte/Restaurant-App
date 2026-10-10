// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

/**
 * ESLint flat config for the customer app, modelled on the Meal Sehat admin config. Only the rules
 * from .agents/rules/frontend-rules.md that a linter can check are encoded here (strict typing,
 * alias-only imports, selector prefixes, standalone, template correctness and accessibility); the
 * architectural rules stay enforced by review.
 */
module.exports = tseslint.config(
  {
    ignores: [
      'dist/**',
      'www/**',
      'android/**',
      'coverage/**',
      '.angular/**',
      'node_modules/**',
      'e2e/.artifacts/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      '@angular-eslint/prefer-standalone': 'error',

      // Rule 3 (Strict Typing): `any` is strictly prohibited.
      '@typescript-eslint/no-explicit-any': 'error',

      // A leading underscore marks a parameter kept only for the signature (the data-service stubs
      // take the arguments their Supabase versions will need).
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      // Rule 1 (Import Paths): `@` aliases everywhere; relative paths are prohibited.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['./*', '../*'],
              message:
                'Use an `@` alias import (Rule 1 in .agents/rules/frontend-rules.md) instead of a relative path.',
            },
          ],
        },
      ],
    },
  },
  {
    // Test doubles (@testing/*) may only be imported from specs.
    files: ['src/**/*.ts'],
    ignores: ['src/**/*.spec.ts', 'src/utils/testing/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['./*', '../*'],
              message: 'Use an `@` alias import (Rule 1) instead of a relative path.',
            },
            { group: ['@testing/*'], message: '@testing/* is for .spec.ts files only.' },
          ],
        },
      ],
    },
  },
  {
    // End-to-end specs live outside src: the @ aliases do not reach them, so they import each
    // other by relative path (the one place Rule 1 cannot apply).
    files: ['e2e/**/*.ts', 'playwright.config.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    // Node build configs.
    files: ['eslint.config.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {},
  },
);
