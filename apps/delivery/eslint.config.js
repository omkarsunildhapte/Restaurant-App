// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

/** Rule 1 (Import Paths): `@` aliases only, no relative paths. */
const RELATIVE_IMPORTS = {
  group: ['./*', '../*'],
  message:
    'Use an `@` alias import (Rule 1 in .agents/rules/frontend-rules.md) instead of a relative path.',
};

/**
 * ESLint flat config, modelled on the Meal Sehat admin website. Only the mechanically checkable
 * rules from .agents/rules/frontend-rules.md are encoded here (strict typing, import paths,
 * selector prefixes, Angular/template correctness and accessibility); the architectural rules
 * (signals-first, resource APIs, folder structure, constants) are enforced by review.
 */
module.exports = tseslint.config(
  {
    ignores: [
      'dist/**',
      'www/**',
      'coverage/**',
      '.angular/**',
      'node_modules/**',
      'android/**',
      'ios/**',
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

      // Rule 3 (Strict Typing): `any` is prohibited.
      '@typescript-eslint/no-explicit-any': 'error',

      // A leading underscore marks a parameter kept only for the signature (the Phase 5 stubs
      // take their future arguments now); a genuinely unused variable is still an error.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      // Rule 1 (Import Paths): `@` aliases only, no relative paths.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            RELATIVE_IMPORTS,
            {
              group: ['@testing/*'],
              message: 'Test doubles (@testing) may only be imported from .spec.ts files.',
            },
          ],
        },
      ],
    },
  },
  {
    // Specs and test doubles: the @testing alias is allowed here only.
    files: ['src/**/*.spec.ts', 'src/utils/testing/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: [RELATIVE_IMPORTS] }] },
  },
  {
    // End-to-end specs live outside src: the @ aliases only reach the app's constants, so the
    // e2e files reference each other by relative path.
    files: ['e2e/**/*.ts', 'playwright.config.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    // Node-side config files.
    files: ['*.config.ts', 'capacitor.config.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {},
  },
);
