import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../**/*.mdx', '../**/*.@(mdx|stories.@(js|jsx|ts|tsx))'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-designs', '@storybook/addon-docs', '@storybook/addon-themes'],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
};

export default config;

// To customize your webpack configuration you can use the webpackFinal field.
// Check https://storybook.js.org/docs/react/builders/webpack#extending-storybooks-webpack-config
// and https://nx.dev/recipes/storybook/custom-builder-configs
