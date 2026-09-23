import { setCompodocJson } from '@storybook/addon-docs/angular';
import { withThemeByClassName } from '@storybook/addon-themes';
import type { Preview, StorybookConfig } from '@storybook/angular';

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
          'WPP Light': 'wpp-light-theme',
          'WPP Dark': 'wpp-dark-theme',
        },
        defaultTheme: 'HRA Light',
      }),
    ],
  };
}
