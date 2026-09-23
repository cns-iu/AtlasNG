import { posix } from 'node:path';
import { createStorybookMainConfig } from '../src/index.ts';

/** Maximum time to wait for a referenced Storybook to start. */
const storybookStartTimeout = 90_000;

/**
 * Pauses execution for the requested duration.
 *
 * @param milliseconds - Delay duration in milliseconds.
 * @returns A promise that resolves after the delay.
 */
function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Waits until a referenced Storybook preview is available.
 *
 * @param url - Base URL of the referenced Storybook.
 * @returns A promise that resolves when the preview responds successfully.
 */
async function waitForStorybook(url: string): Promise<void> {
  const deadline = Date.now() + storybookStartTimeout;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${url}/iframe.html`, {
        signal: AbortSignal.timeout(5_000),
      });

      if (response.ok) {
        return;
      }
    } catch {
      // The referenced Storybook is still starting.
    }

    await delay(250);
  }

  throw new Error(`Timed out waiting for Storybook at ${url}`);
}

/**
 * Selects the appropriate URL for a referenced Storybook based on the current configuration.
 *
 * @param path Output path of the referenced Storybook.
 * @param port Port number for the referenced Storybook in development mode.
 * @param outputDir Output directory for the current Storybook build.
 * @param production Whether the current build is a production build.
 * @returns The appropriate URL for the referenced Storybook.
 */
function resolveRefPath(path: string, port: number, outputDir: string | undefined, production: boolean): string {
  if (production) {
    outputDir ??= 'dist/storybook/internal-storybook/';
    return posix.relative(outputDir, path);
  }

  return `http://localhost:${port}`;
}

const config = createStorybookMainConfig({
  refs: async (_refs, { configType, outputDir }) => {
    const production = configType === 'PRODUCTION';

    const refs = {
      'design-system': {
        title: 'Design System',
        url: resolveRefPath('dist/storybook/design-system/', 4401, outputDir, production),
        sourceUrl: 'https://github.com/cns-iu/AtlasNG/tree/main/libs/design-system',
      },
      labs: {
        title: 'Labs',
        url: resolveRefPath('dist/storybook/labs/', 4402, outputDir, production),
        sourceUrl: 'https://github.com/cns-iu/AtlasNG/tree/main/libs/labs',
        expanded: false,
      },
      'kg-explorer': {
        title: 'KG Explorer',
        url: resolveRefPath('dist/storybook/kg-explorer/', 4403, outputDir, production),
        sourceUrl: 'https://github.com/cns-iu/AtlasNG/tree/main/libs/applications/kg-explorer',
      },
    };

    if (!production) {
      await Promise.all(Object.values(refs).map(({ url }) => waitForStorybook(url)));
    }

    return refs;
  },
});

export default config;
