/* eslint-disable import/no-commonjs */
const path = require('path');

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: [path.join(__dirname, 'tsconfig.json')],
    tsconfigRootDir: __dirname,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'unused-imports', 'import', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:react-hooks/recommended',
  ],
  settings: {
    'import/resolver': {
      typescript: {
        project: [path.join(__dirname, 'tsconfig.json')],
      },
      node: {},
    },
    react: { version: 'detect' },
  },
  rules: {
    // Disable base rule (use TS-aware one)
    'no-unused-vars': 'off',

    // Aggressive removal of unused imports (keeps tree clean)
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

    // TypeScript tweaks
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_', // allow `_err`
        ignoreRestSiblings: true,
      },
    ],
    '@typescript-eslint/no-unused-expressions': [
      'error',
      { allowShortCircuit: true, allowTernary: true, allowTaggedTemplates: true },
    ],
    // Nudge toward `import type { ... }`
    '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],

    // React Hooks: turn off deps nag — many patterns are intentional in this codebase
    'react-hooks/exhaustive-deps': 'off',

    // import plugin: avoid noise
    'import/export': 'off',
    'import/no-duplicates': 'warn',
    // Silence memo/named export caution (React has a named `memo`)
    'import/no-named-as-default-member': 'off',

    // Pragmatic noise control
    'no-empty': ['warn', { allowEmptyCatch: true }],
    'prefer-const': 'warn',

    // Allow console across the app (debug-heavy project)
    'no-console': 'off',
  },

  overrides: [
    // API routes / server handlers: allow anything console-related and hook heuristics
    {
      files: ['app/api/**/*.{ts,tsx}'],
      rules: {
        'no-console': 'off',
        'react-hooks/exhaustive-deps': 'off',
      },
    },
    // Debug/trace utilities can log freely
    {
      files: [
        'lib/**/debug*.{ts,tsx}',
        'lib/**/trace*.{ts,tsx}',
        'lib/utils/**/{debugLogger,renderTrace}.ts',
      ],
      rules: { 'no-console': 'off' },
    },
    // Test playground & demo tabs: relax strictness
    {
      files: ['app/(menu)/Test/**/*.{ts,tsx}'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        'unused-imports/no-unused-vars': 'off',
        'react-hooks/exhaustive-deps': 'off',
        'no-console': 'off',
      },
    },
    // wagmi adapter-style components often accept but ignore many props (isConnected, etc.)
    {
      files: ['components/Buttons/Connect/**/*.{ts,tsx}', 'components/Buttons/CustomConnectButton.tsx'],
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            varsIgnorePattern:
              '^_|^(isConnected|isConnecting|hide|address|ensName|chain)$',
            argsIgnorePattern: '^_',
          },
        ],
        'unused-imports/no-unused-vars': 'off',
      },
    },
  ],

  ignorePatterns: ['**/node_modules/**', '.next/**', 'dist/**', 'coverage/**', '**/*.d.ts'],
};
