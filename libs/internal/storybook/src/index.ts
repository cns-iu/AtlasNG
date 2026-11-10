import { setCompodocJson } from '@storybook/addon-docs/angular';
import { withThemeByClassName } from '@storybook/addon-themes';
import type { Preview, StorybookConfig } from '@storybook/angular';

/**
 * Toolbar background options: the Material 3 surface roles of the selected theme.
 * Each value reads the role's CSS variable, so the background follows the theme's brand and light or dark mode.
 */
const SURFACE_BACKGROUNDS = {
  surface: { name: 'Surface', value: 'var(--mat-sys-surface)' },
  'surface-dim': { name: 'Surface Dim', value: 'var(--mat-sys-surface-dim)' },
  'surface-bright': { name: 'Surface Bright', value: 'var(--mat-sys-surface-bright)' },
  'surface-container-lowest': { name: 'Surface Container Lowest', value: 'var(--mat-sys-surface-container-lowest)' },
  'surface-container-low': { name: 'Surface Container Low', value: 'var(--mat-sys-surface-container-low)' },
  'surface-container': { name: 'Surface Container', value: 'var(--mat-sys-surface-container)' },
  'surface-container-high': { name: 'Surface Container High', value: 'var(--mat-sys-surface-container-high)' },
  'surface-container-highest': { name: 'Surface Container Highest', value: 'var(--mat-sys-surface-container-highest)' },
};

/** Options used to configure the shared Storybook preview. */
export interface StorybookPreviewOptions {
  /** Compodoc JSON generated for the consuming project. */
  docJson?: unknown;
}

/**
 * Creates the standard Storybook main configuration with optional project-specific overrides.
 *
 * @param overrides - Configuration values that replace or extend the shared defaults.
 * @returns The complete Storybook main configuration.
 */
export function createStorybookMainConfig(overrides: Partial<StorybookConfig> = {}): StorybookConfig {
  return {
    stories: ['../**/*.mdx', '../**/*.@(mdx|stories.@(js|jsx|ts|tsx))'],
    addons: ['@storybook/addon-a11y', '@storybook/addon-designs', '@storybook/addon-docs', '@storybook/addon-themes'],
    framework: {
      name: '@storybook/angular',
      options: {},
    },
    core: {
      disableTelemetry: true,
    },
    docs: {
      defaultName: 'Documentation',
    },
    ...overrides,
  };
}

/**
 * Creates the standard Storybook preview and registers project-specific Compodoc data.
 *
 * @param options - Generated Compodoc JSON for the project.
 * @returns The complete Storybook preview configuration.
 */
export function createStorybookPreview({ docJson }: StorybookPreviewOptions): Preview {
  if (docJson) {
    setCompodocJson(docJson);
  }

  return {
    // NOTE: Do not define `tags` here! They must be defined inline in `preview.ts`
    decorators: [
      withThemeByClassName({
        themes: {
          'CNS Light': 'cns-light-theme',
          'CNS Dark': 'cns-dark-theme',
          'HRA Light': 'hra-light-theme',
          'HRA Dark': 'hra-dark-theme',
          'Multiscale Human Light': 'mhu-light-theme',
          'Multiscale Human Dark': 'mhu-dark-theme',
          'WPP Light': 'wpp-light-theme',
          'WPP Dark': 'wpp-dark-theme',
        },
        defaultTheme: 'HRA Light',
      }),
    ],
    parameters: {
      backgrounds: { options: SURFACE_BACKGROUNDS },
    },
    initialGlobals: {
      backgrounds: { value: 'surface' },
    },
  };
}
