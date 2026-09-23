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

const LIBRARIES = [
  {
    id: 'design-system',
    title: 'Design System',
    sourceUrl: 'https://github.com/cns-iu/AtlasNG/tree/main/libs/design-system',
    port: 4401,
  },
  {
    id: 'labs',
    title: 'Labs',
    sourceUrl: 'https://github.com/cns-iu/AtlasNG/tree/main/libs/labs',
    port: 4402,
    expanded: false,
  },
  {
    id: 'kg-explorer',
    title: 'KG Explorer',
    sourceUrl: 'https://github.com/cns-iu/AtlasNG/tree/main/libs/applications/kg-explorer',
    port: 4403,
  },
];

const config = createStorybookMainConfig({
  refs: async (_refs, { configType }) => {
    const production = configType === 'PRODUCTION';

    type Ref = { title: string; url: string; sourceUrl?: string; expanded?: boolean };
    const refs = LIBRARIES.reduce<Record<string, Ref>>((acc, ref) => {
      acc[ref.id] = {
        title: ref.title,
        url: production ? `./${ref.id}` : `http://localhost:${ref.port}`,
        sourceUrl: ref.sourceUrl,
        expanded: ref.expanded ?? true,
      };
      return acc;
    }, {});

    if (!production) {
      await Promise.all(Object.values(refs).map(({ url }) => waitForStorybook(url)));
    }

    return refs;
  },
  staticDirs: (_dirs, { configType }) => {
    if (configType === 'PRODUCTION') {
      const outputDir = '../../../../dist/storybook';
      return LIBRARIES.map((ref) => ({ from: `${outputDir}/${ref.id}/`, to: ref.id }));
    }

    return [];
  },
});

export default config;
