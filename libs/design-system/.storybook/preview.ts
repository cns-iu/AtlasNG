import { withThemeByClassName } from '@storybook/addon-themes';

export const decorators = [
  withThemeByClassName({
    themes: {
      'CNS Light': 'cns-light-theme',
      'CNS Dark': 'cns-dark-theme',
      'HRA Light': 'hra-light-theme',
      'HRA Dark': 'hra-dark-theme',
      'WPP Light': 'wpp-light-theme',
      'WPP Dark': 'wpp-dark-theme',
    },
    defaultTheme: 'HRA Light',
  }),
];
