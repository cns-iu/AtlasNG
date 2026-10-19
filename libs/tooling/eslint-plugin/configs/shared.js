// @ts-check

/**
 * Glob patterns for every JavaScript and TypeScript source file.
 *
 * The core rules are scoped to all of them in both the JavaScript and the TypeScript configuration.
 * `@nx/eslint-plugin` appends `eslint-config-prettier` without a `files` filter, which turns `curly`
 * off for every file. Re-applying the core rules to all source files after each Nx configuration
 * keeps them in effect regardless of the order in which consumers spread the configurations.
 */
export const SOURCE_FILES = [
  '**/*.ts',
  '**/*.tsx',
  '**/*.cts',
  '**/*.mts',
  '**/*.js',
  '**/*.jsx',
  '**/*.cjs',
  '**/*.mjs',
];

/** Glob patterns for TypeScript source files. */
export const TYPESCRIPT_FILES = ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'];

/**
 * Core ESLint rules shared by JavaScript and TypeScript files.
 *
 * @type {import('eslint').Linter.Config}
 */
export const coreRules = {
  name: '@atlasng/core-rules',
  files: SOURCE_FILES,
  rules: {
    curly: ['error', 'all'],
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    'max-depth': ['error', 5],
    'max-nested-callbacks': ['error', 4],
    'no-alert': 'warn',
    'no-console': 'warn',
    'no-constructor-return': 'error',
    'no-duplicate-imports': 'error',
    'no-else-return': 'warn',
    'no-empty-function': ['error', { allow: ['arrowFunctions', 'constructors'] }],
    'no-eval': 'error',
    'no-labels': 'error',
    'no-lonely-if': 'warn',
    'no-multi-str': 'error',
    'no-proto': 'error',
    'no-restricted-syntax': [
      'error',
      {
        selector: 'SequenceExpression',
        message: "The comma operator is confusing and a common mistake. Don't use it!",
      },
    ],
    'no-shadow': 'error',
    'no-template-curly-in-string': 'warn',
    'no-throw-literal': 'error',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    yoda: 'warn',
  },
};
