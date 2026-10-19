// @ts-check
import storybook from 'eslint-plugin-storybook';

/**
 * Configuration for Storybook stories and `.storybook` configuration directories.
 *
 * ESLint ignores dot-directories by default, so `.storybook` is explicitly unignored.
 *
 * @type {import('eslint').Linter.Config[]}
 */
const config = [
  .../** @type {import('eslint').Linter.Config[]} */ (storybook.configs['flat/recommended']),
  {
    name: '@atlasng/storybook-unignore',
    ignores: ['!.storybook'],
  },
];

export default config;
