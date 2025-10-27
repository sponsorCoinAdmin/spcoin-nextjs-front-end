/* eslint-disable import/no-commonjs */
const path = require('path');

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: [path.join(__dirname, 'tsconfig.json')],
    tsconfigRootDir: __dirname,
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: [
    '@typescript-eslint',
    'unused-imports',
    'import',
    'react-hooks'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:react-hooks/recommended'
  ],
  settings: {
    'import/resolver': {
      typescript: {
        project: [path.join(__dirname, 'tsconfig.json')]
      },
      node: {}
    },
    react: { version: 'detect' }
  },
  rules: {
    // keep aggressive removal of unused imports
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_', ignoreRestSiblings: true }
    ],

    // TypeScript tweaks
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { varsIgnorePattern: '^_', argsIgnorePattern: '^_', ignoreRestSiblings: true }
    ],
    '@typescript-eslint/no-unused-expressions': ['error', {
      allowShortCircuit: true,
      allowTernary: true,
      allowTaggedTemplates: true
    }],

    // React Hooks (plugin installed via devDep below)
    'react-hooks/exhaustive-deps': 'warn',

    // import plugin: avoid previous stack overflow on deep/barelled trees
    'import/export': 'off',
    'import/no-duplicates': 'warn',

    // pragmatic noise control
    'no-empty': 'warn',
    'prefer-const': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }]
  },
  ignorePatterns: [
    '**/node_modules/**',
    '.next/**',
    'dist/**',
    'coverage/**',
    '**/*.d.ts'
  ]
};
