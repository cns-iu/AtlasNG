import { setCompodocJson } from '@storybook/addon-docs/angular';
import { DecoratorHelpers } from '@storybook/addon-themes';
import type { Decorator, Preview, StorybookConfig } from '@storybook/angular';

/** Theme names shown in the toolbar theme picker, mapped to the class each one sets on `<html>`. */
const THEMES: Record<string, string> = {
  'CNS Light': 'cns-light-theme',
  'CNS Dark': 'cns-dark-theme',
  'HRA Light': 'hra-light-theme',
  'HRA Dark': 'hra-dark-theme',
  'Multiscale Human Light': 'mhu-light-theme',
  'Multiscale Human Dark': 'mhu-dark-theme',
  'WPP Light': 'wpp-light-theme',
  'WPP Dark': 'wpp-dark-theme',
};

/** Theme applied when neither the toolbar nor the story selects one. */
const DEFAULT_THEME = 'HRA Light';

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
 * Creates a decorator that sets the selected theme's class on `<html>` while the story renders.
 * Replaces `withThemeByClassName`, which sets the class in an effect that Storybook runs only after it marks
 * the story rendered. Stories with a scroll-driven animation, such as `ang-scroll-area`, are marked rendered
 * only after a 5-second timeout, so they stayed unstyled until then (storybookjs/storybook#36873).
 * The toolbar theme picker and a story's `themes.themeOverride` parameter work as before.
 *
 * @param themes - Theme names mapped to the class each one sets on `<html>`.
 * @param defaultTheme - Theme used when neither the toolbar nor the story selects one.
 * @returns A decorator that applies the selected theme's class.
 */
function withThemeClass(themes: Record<string, string>, defaultTheme: string): Decorator {
  DecoratorHelpers.initializeThemeState(Object.keys(themes), defaultTheme);

  return (storyFn, context) => {
    const { themeOverride } = context.parameters['themes'] ?? {};
    const selected = themeOverride || DecoratorHelpers.pluckThemeFromContext(context) || defaultTheme;
    const { classList } = document.documentElement;
    classList.remove(...Object.values(themes));
    classList.add(themes[selected] ?? themes[defaultTheme]);
    return storyFn();
  };
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
    decorators: [withThemeClass(THEMES, DEFAULT_THEME)],
    parameters: {
      backgrounds: { options: SURFACE_BACKGROUNDS },
    },
    initialGlobals: {
      backgrounds: { value: 'surface' },
    },
  };
}
