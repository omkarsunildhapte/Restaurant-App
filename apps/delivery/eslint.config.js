// @ts-check
// ESLint 9 flat config (replaces .eslintrc.json; same rules).
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    // Same rule set as the old .eslintrc.json (angular-eslint recommended only).
    extends: [...angular.configs.tsRecommended],
    languageOptions: { parser: tseslint.parser },
    processor: angular.processInlineTemplates,
    rules: {
      // Form pages keep ChangeDetectionStrategy.Eager: their error messages read plain form state.
      '@angular-eslint/prefer-on-push-component-change-detection': 'off',
      '@angular-eslint/component-class-suffix': ['error', { suffixes: ['Page', 'Component'] }],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended],
    rules: {},
  },
);
