import { Component, input } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { DataLoader } from '@atlasng/content-blocks/loaders';
import { ContentDefinition, ContentBlockNode } from '@atlasng/content-blocks/types';
import { passthroughSchema } from '@atlasng/content-blocks/utils';
import { StandardSchemaV1 } from '@standard-schema/spec';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { interval, map, startWith, switchMap, throwError, timer } from 'rxjs';
import { expect, waitFor } from 'storybook/test';
import { JsonValue } from 'type-fest';
import { provideContentBlocks, withDataLoaders, withDefinitions } from '../providers';
import { ContentBlock } from './content-block';

/** Schema accepting string config values. */
const stringSchema: StandardSchemaV1<JsonValue | undefined, string> = {
  '~standard': {
    version: 1,
    vendor: 'story',
    validate: (value) => (typeof value === 'string' ? { value } : { issues: [{ message: 'Expected a string.' }] }),
  },
};

/** Heading rendered for `heading` nodes. */
@Component({ selector: 'ang-story-heading', template: '<h2>{{ title() }}</h2>' })
class StoryHeading {
  /** Heading text. */
  readonly title = input.required<string>();
}

/** Paragraph rendered for `paragraph` nodes. */
@Component({ selector: 'ang-story-paragraph', template: '<p><ng-content /></p>' })
class StoryParagraph {}

/** Card with a title slot and a body, rendered for `card` nodes. */
@Component({
  selector: 'ang-story-card',
  template: `
    <section style="max-width: 32rem; padding: 1rem; border: 1px solid #d0d7de; border-radius: 0.5rem">
      <h3 style="margin-top: 0"><ng-content select="[slot=title]" /></h3>
      <ng-content />
    </section>
  `,
})
class StoryCard {}

/** List of rows, rendered for `list` nodes. */
@Component({
  selector: 'ang-story-list',
  template: '<ul>@for (row of rows(); track $index) { <li>{{ row }}</li> }</ul>',
})
class StoryList {
  /** Rows to list. */
  readonly rows = input<unknown[]>([]);
}

/** Placeholder shown while a `list` node loads. */
@Component({
  selector: 'ang-story-placeholder',
  imports: [MatProgressSpinner],
  template: `
    <p role="status" style="display: flex; gap: 0.5rem; align-items: center; color: #57606a">
      <mat-spinner diameter="20" />
      Loading {{ node().component }}…
    </p>
  `,
})
class StoryPlaceholder {
  /** The node being loaded. */
  readonly node = input.required<ContentBlockNode>();
}

/** Error component shown when a `list` node fails. */
@Component({
  selector: 'ang-story-error',
  template: '<p role="alert" style="color: #cf222e">Could not show {{ definition()?.name }}: {{ message() }}</p>',
})
class StoryError {
  /** The thrown value. */
  readonly error = input<unknown>();
  /** Definition of the failed node. */
  readonly definition = input<ContentDefinition>();

  /**
   * Describes the error.
   *
   * @returns The error message, or the thrown value as a string.
   */
  message(): string {
    const error = this.error();
    return error instanceof Error ? error.message : String(error);
  }
}

/** Text component used by the text component story: renders text nodes as highlighted spans. */
@Component({
  selector: 'ang-story-text',
  template: '<mark style="padding: 0 0.125rem">{{ text() }}</mark>',
})
class StoryText {
  /** The text node's text. */
  readonly text = input.required<string>();
}

/**
 * Waits before resolving, standing in for a lazily loaded chunk.
 *
 * @param value Value to resolve with.
 * @param delay Delay in milliseconds.
 * @returns Resolves with `value` after `delay`.
 */
function later<T>(value: T, delay = 1500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), delay));
}

/** Definitions available to the story documents. */
const definitions: ContentDefinition[] = [
  { name: 'heading', component: StoryHeading, config: { title: stringSchema } },
  { name: 'paragraph', component: StoryParagraph, content: { content: '*' } },
  { name: 'card', component: StoryCard, content: { title: '[slot=title]', body: '*' } },
  {
    name: 'list',
    component: StoryList,
    data: { rows: passthroughSchema() },
    placeholderComponent: StoryPlaceholder,
    errorComponent: StoryError,
  },
];

/**
 * Definitions registered lazily: the definition itself is loaded by a factory, and its component by a loader, as with
 * `() => import('./table.definition')`.
 */
const lazyDefinitions: Record<string, () => Promise<ContentDefinition>> = {
  'lazy-list': () =>
    later(
      {
        name: 'lazy-list',
        component: () => later({ default: StoryList }),
        data: { rows: passthroughSchema() },
        placeholderComponent: StoryPlaceholder,
      },
      500,
    ),
};

/** Emits a new reading per region every `period` milliseconds, standing in for a live data feed. */
const liveLoader: DataLoader<{ regions: string[]; period?: number }> = {
  load: ({ regions, period = 1000 }) =>
    interval(period).pipe(
      startWith(-1),
      map((tick) => regions.map((region, index) => `${region}: ${((tick + 1) * (index + 3) * 7) % 100} orders`)),
    ),
};

/** Emits `value` after `delay` milliseconds, standing in for a slow request. */
const delayedLoader: DataLoader<{ value: unknown; delay?: number }> = {
  load: ({ value, delay = 3000 }) => timer(delay).pipe(map(() => value)),
};

/** Fails with `message` after `delay` milliseconds, standing in for a failing request. */
const failingLoader: DataLoader<{ message: string; delay?: number }> = {
  load: ({ message, delay = 3000 }) => timer(delay).pipe(switchMap(() => throwError(() => new Error(message)))),
};

const meta: Meta<ContentBlock> = {
  component: ContentBlock,
  title: 'Content Blocks/Content Block',
  decorators: [
    applicationConfig({
      providers: [
        provideContentBlocks(
          {},
          withDefinitions(definitions),
          withDefinitions(lazyDefinitions),
          withDataLoaders({ delayed: () => delayedLoader, failing: () => failingLoader, live: () => liveLoader }),
        ),
      ],
    }),
  ],
  render: (args) => ({
    props: args,
    template: '<ang-content-block [document]="document" />',
  }),
};

export default meta;

type Story = StoryObj<ContentBlock>;

/** Text and components with config, rendered from a JSON document. */
export const Default: Story = {
  args: {
    document: {
      version: 1,
      content: [
        { component: 'heading', config: { title: 'Content blocks' } },
        { component: 'paragraph', content: ['Rendered from a JSON ', 'content document.'] },
      ],
    },
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('heading', { name: 'Content blocks' })).toBeVisible();
    await expect(canvas.getByText('Rendered from a JSON content document.')).toBeVisible();
  },
};

/**
 * Content projected by name: the card's definition maps `title` and `body` to its `ng-content` slots. Content can nest
 * further components.
 */
export const ProjectedContent: Story = {
  args: {
    document: {
      version: 1,
      content: {
        component: 'card',
        content: {
          title: 'Quarterly sales',
          body: [
            { component: 'paragraph', content: 'Sales grew in every region.' },
            { component: 'paragraph', content: ['See the ', { component: 'heading', config: { title: 'Report' } }] },
          ],
        },
      },
    },
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('heading', { level: 3, name: 'Quarterly sales' })).toBeVisible();
    await expect(canvas.getByText('Sales grew in every region.')).toBeVisible();
    await expect(canvas.getByRole('heading', { level: 2, name: 'Report' })).toBeVisible();
  },
};

/**
 * A node whose definition declares a `placeholderComponent` is a boundary: it shows the placeholder while its data
 * loads, without holding up the rest of the document.
 */
export const Placeholder: Story = {
  args: {
    document: {
      version: 1,
      content: [
        { component: 'heading', config: { title: 'Regions' } },
        { component: 'list', data: { rows: { type: 'delayed', value: ['North', 'South', 'East', 'West'] } } },
      ],
    },
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('heading', { name: 'Regions' })).toBeVisible();
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading list…');
    await expect(await canvas.findAllByRole('listitem', {}, { timeout: 5000 })).toHaveLength(4);
    await expect(canvas.queryByRole('status')).not.toBeInTheDocument();
  },
};

/**
 * A failing node shows its definition's `errorComponent` in place of its boundary. The rest of the document is not
 * affected, and the error is reported to Angular's `ErrorHandler`.
 */
export const ErrorBoundary: Story = {
  args: {
    document: {
      version: 1,
      content: [
        { component: 'heading', config: { title: 'Regions' } },
        { component: 'list', data: { rows: { type: 'failing', message: 'Server unavailable.' } } },
      ],
    },
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('alert', {}, { timeout: 5000 })).toHaveTextContent(
      'Could not show list: Server unavailable.',
    );
    await expect(canvas.getByRole('heading', { name: 'Regions' })).toBeVisible();
  },
};

/**
 * Data values are signals: each value a loader emits is parsed, validated, and bound to the component, so the rendered
 * list updates in place.
 */
export const LiveData: Story = {
  args: {
    document: {
      version: 1,
      content: [
        { component: 'heading', config: { title: 'Orders by region' } },
        { component: 'list', data: { rows: { type: 'live', regions: ['North', 'South', 'East', 'West'] } } },
      ],
    },
  },
  play: async ({ canvas }) => {
    const [first] = await canvas.findAllByRole('listitem');
    const initial = first?.textContent;
    await waitFor(() => expect(canvas.getAllByRole('listitem')[0]).not.toHaveTextContent(initial ?? ''), {
      timeout: 3000,
    });
  },
};

/**
 * Definitions and components can load lazily. The definition loads first; the placeholder shows while the component
 * loads.
 */
export const LazyLoading: Story = {
  args: {
    document: {
      version: 1,
      content: { component: 'lazy-list', data: { rows: ['Loaded', 'on', 'demand'] } },
    },
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('status')).toHaveTextContent('Loading lazy-list…');
    await expect(await canvas.findAllByRole('listitem', {}, { timeout: 4000 })).toHaveLength(3);
  },
};

/** Text nodes render with the configured `textComponent`, which receives the text through a `text` input. */
export const TextComponent: Story = {
  decorators: [applicationConfig({ providers: [provideContentBlocks({ textComponent: StoryText })] })],
  args: {
    document: {
      version: 1,
      content: [
        'Plain text nodes ',
        { component: 'paragraph', content: ['are rendered with ', 'the text component.'] },
      ],
    },
  },
  play: async ({ canvas }) => {
    await expect((await canvas.findByText('Plain text nodes')).tagName).toBe('MARK');
    await expect(canvas.getByText('the text component.').tagName).toBe('MARK');
  },
};
