/* eslint-disable import/no-commonjs */
const path = require('path');

module.exports = {
  root: true,
  plugins: [
    '@typescript-eslint',
    'unused-imports',
    'import',
    'react-hooks',
    'next',
  ],
  extends: [
    // Base
    'eslint:recommended',

    // Next.js rules (adds @next/next/* messages that your build referenced)
    'next/core-web-vitals',

    // TS w/ type-checking aware configs (v6 preset names)
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',

    // import resolver helpers
    'plugin:import/recommended',
    'plugin:import/typescript',

    // Hooks
    'plugin:react-hooks/recommended',
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
    // ------- Unused detection (keep these strong) -------
    'no-unused-vars': 'off', // use TS-aware version
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],

    // ------- Pragmatic TS strictness tuning -------
    // You’re hitting thousands of these; relax them to warnings so builds pass,
    // while still surfacing problems during local dev.
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/no-unsafe-argument': 'warn',
    '@typescript-eslint/no-unsafe-return': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-enum-comparison': 'off', // noisy with mixed enums
    '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    '@typescript-eslint/no-redundant-type-constituents': 'off',
    '@typescript-eslint/restrict-template-expressions': [
      'warn',
      { allowNumber: true, allowBoolean: true, allowNullish: true, allowAny: true },
    ],

    // Promise rules: keep signal, reduce friction in React effects & fire-and-forget
    '@typescript-eslint/no-floating-promises': [
      'warn',
      { ignoreVoid: true, ignoreIIFE: true },
    ],
    '@typescript-eslint/require-await': 'off',
    '@typescript-eslint/await-thenable': 'off',
    '@typescript-eslint/no-misused-promises': [
      'warn',
      {
        checksVoidReturn: { attributes: false, arguments: false },
        checksConditionals: false,
      },
    ],

    // TS style preferences
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],

    // React Hooks (keep default recommended; deps rule off as requested)
    'react-hooks/exhaustive-deps': 'off',

    // import plugin: keep useful, drop noisy
    'import/export': 'off',
    'import/no-duplicates': 'warn',
    'import/no-named-as-default-member': 'off',

    // Next rule that warned about <img>; keep as a warning for now
    '@next/next/no-img-element': 'warn',

    // Misc project prefs
    'no-empty': ['warn', { allowEmptyCatch: true }],
    'prefer-const': 'warn',
    'no-console': 'off',
  },

  overrides: [
    // API routes / server handlers
    {
      files: ['app/api/**/*.{ts,tsx}'],
      rules: {
        'no-console': 'off',
        'react-hooks/exhaustive-deps': 'off',
      },
    },
    // Debug/trace utilities
    {
      files: [
        'lib/**/debug*.{ts,tsx}',
        'lib/**/trace*.{ts,tsx}',
        'lib/utils/**/{debugLogger,renderTrace}.ts',
      ],
      rules: { 'no-console': 'off' },
    },
    // Playground: keep it loose
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
    // Components that intentionally accept extra props from wagmi/connectors
    {
      files: [
        'components/Buttons/Connect/**/*.{ts,tsx}',
        'components/Buttons/CustomConnectButton.tsx',
      ],
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            varsIgnorePattern: '^_|^(isConnected|isConnecting|hide|address|ensName|chain)$',
            argsIgnorePattern: '^_',
          },
        ],
        'unused-imports/no-unused-vars': 'off',
      },
    },
    // Legacy “helpers” & “context” hot spots: downgrade safety rules to warnings only
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
        '@typescript-eslint/restrict-template-expressions': [
          'warn',
          { allowNumber: true, allowBoolean: true, allowNullish: true, allowAny: true },
        ],
        '@typescript-eslint/no-floating-promises': [
          'warn',
          { ignoreVoid: true, ignoreIIFE: true },
        ],
        '@typescript-eslint/no-misused-promises': [
          'warn',
          { checksVoidReturn: { attributes: false, arguments: false }, checksConditionals: false },
        ],
      },
    },
  ],

  ignorePatterns: [
    '**/node_modules/**',
    '.next/**',
    'dist/**',
    'coverage/**',
    '**/*.d.ts',
    // generated or legacy build outputs if any
    'scripts/**/dist/**',
  ],
};
