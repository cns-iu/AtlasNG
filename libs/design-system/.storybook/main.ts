import { createStorybookMainConfig } from '../../internal/storybook/src/index.ts';

const config = createStorybookMainConfig({
  staticDirs: [
    { from: './assets', to: 'assets' },
    { from: '../version-control/assets', to: 'assets' },
  ],
});

export default config;
