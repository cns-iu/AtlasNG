import { createStorybookMainConfig } from '../../../internal/storybook/src/index.ts';

const config = createStorybookMainConfig({
  staticDirs: [
    { from: './assets', to: 'assets' },
    // Output of `nx build icons`, used by the metadata view icons
    { from: '../../../../dist/libs/resources/icons', to: 'ang-icons' },
  ],
});

export default config;
