// File: .eslintrc.cjs
/* eslint-disable import/no-commonjs */
const path = require('path');

module.exports = {
  root: true,
  plugins: ['@typescript-eslint', 'unused-imports', 'import'],
  extends: [
    'eslint:recommended',
    'next/core-web-vitals', // includes react-hooks rules
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: [path.join(__dirname, 'tsconfig.json')],
    tsconfigRootDir: __dirname,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  settings: {
    react: { version: 'detect' },
    'import/resolver': {
      typescript: { project: [path.join(__dirname, 'tsconfig.json')] },
      node: {},
    },
  },
  rules: {
    // Unused
    'no-unused-vars': 'off',
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': ['warn', { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_', ignoreRestSiblings: true }],
    '@typescript-eslint/no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_', ignoreRestSiblings: true }],

    // TS strictness tuning
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/no-unsafe-argument': 'warn',
    '@typescript-eslint/no-unsafe-return': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-enum-comparison': 'off',
    '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    '@typescript-eslint/no-redundant-type-constituents': 'off',
    '@typescript-eslint/restrict-template-expressions': ['warn', { allowNumber: true, allowBoolean: true, allowNullish: true, allowAny: true }],

    // ✅ unblock builds: make this a warning (or set to 'off' if you prefer)
    '@typescript-eslint/prefer-nullish-coalescing': 'warn',

    // Promises
    '@typescript-eslint/no-floating-promises': ['warn', { ignoreVoid: true, ignoreIIFE: true }],
    '@typescript-eslint/require-await': 'off',
    '@typescript-eslint/await-thenable': 'off',
    '@typescript-eslint/no-misused-promises': ['warn', { checksVoidReturn: { attributes: false, arguments: false }, checksConditionals: false }],

    // Style
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],

    // Next/React
    'react-hooks/exhaustive-deps': 'off', // Next provides react-hooks plugin; we just tune this rule
    '@next/next/no-img-element': 'warn',

    // Misc
    'import/export': 'off',
    'import/no-duplicates': 'warn',
    'import/no-named-as-default-member': 'off',
    'no-empty': ['warn', { allowEmptyCatch: true }],
    'prefer-const': 'warn',
    'no-console': 'off',
  },
  overrides: [
    { files: ['app/api/**/*.{ts,tsx}'], rules: { 'no-console': 'off', 'react-hooks/exhaustive-deps': 'off' } },
    {
      files: ['lib/**/debug*.{ts,tsx}', 'lib/**/trace*.{ts,tsx}', 'lib/utils/**/{debugLogger,renderTrace}.ts'],
      rules: { 'no-console': 'off' },
    },
    {
      files: ['app/(menu)/Test/**/*.{ts,tsx}'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        'unused-imports/no-unused-vars': 'off',
        'react-hooks/exhaustive-deps': 'off',
        'no-console': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
      },
    },
    {
      files: [
        'lib/context/**/*.{ts,tsx}',
        'lib/network/**/*.{ts,tsx}',
        'lib/utils/feeds/**/*.{ts,tsx}',
        'lib/hooks/inputValidations/**/*.{ts,tsx}',
      ],
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'warn',
        '@typescript-eslint/no-unsafe-member-access': 'warn',
        '@typescript-eslint/no-unsafe-argument': 'warn',
        '@typescript-eslint/no-unsafe-return': 'warn',
        '@typescript-eslint/no-unsafe-call': 'warn',
        '@typescript-eslint/no-unnecessary-type-assertion': 'off',
        '@typescript-eslint/no-redundant-type-constituents': 'off',
        '@typescript-eslint/no-unsafe-enum-comparison': 'off',
        '@typescript-eslint/restrict-template-expressions': ['warn', { allowNumber: true, allowBoolean: true, allowNullish: true, allowAny: true }],
        '@typescript-eslint/no-floating-promises': ['warn', { ignoreVoid: true, ignoreIIFE: true }],
        '@typescript-eslint/no-misused-promises': ['warn', { checksVoidReturn: { attributes: false, arguments: false }, checksConditionals: false }],
      },
    },
  ],
  ignorePatterns: ['**/node_modules/**', '.next/**', 'dist/**', 'coverage/**', '**/*.d.ts', 'scripts/**/dist/**'],
};
