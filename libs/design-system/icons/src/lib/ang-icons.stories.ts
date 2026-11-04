import { Component, computed, input, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { applicationConfig, type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';
import { ANG_ICONS_FONT_SET, ANG_ICONS_NAMESPACE, provideAngIcons } from './ang-icons';

/** Base URL of the `@atlasng/icons` build output, served by the design-system Storybook `staticDirs`. */
const ICONS_BASE_URL = 'ang-icons';

/** Icon entry read from the `@atlasng/icons` manifest. */
interface IconEntry {
  /** Icon name. */
  name: string;
  /** Icon category. */
  category: string;
}

/** Icons of one category. */
interface IconGroup {
  /** Category name. */
  category: string;
  /** Icons in the category. */
  icons: IconEntry[];
}

/**
 * Adds the `@atlasng/icons` stylesheet to the document once.
 */
function loadIconStylesheet(): void {
  const id = 'ang-icons-stylesheet';
  if (document.getElementById(id)) {
    return;
  }

  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `${ICONS_BASE_URL}/index.css`;
  document.head.appendChild(link);
}

/**
 * Loads the icon stylesheet and the `@atlasng/icons` manifest.
 *
 * @returns The manifest icons.
 */
async function loadIcons(): Promise<{ icons: IconEntry[] }> {
  loadIconStylesheet();
  const response = await fetch(`${ICONS_BASE_URL}/manifest.json`);
  return { icons: response.ok ? await response.json() : [] };
}

/** Story-only gallery listing every icon in the `@atlasng/icons` manifest, grouped by category. */
@Component({
  selector: 'ang-icon-gallery',
  imports: [MatIcon],
  template: `
    <label class="ang-icon-gallery--search">
      Search icons
      <input type="search" [value]="query()" (input)="query.set($any($event.target).value)" />
    </label>

    @for (group of groups(); track group.category) {
      <section class="ang-icon-gallery--category">
        <h2 class="ang-icon-gallery--category-title">{{ group.category }}</h2>
        <ul class="ang-icon-gallery--grid">
          @for (icon of group.icons; track icon.name) {
            <li class="ang-icon-gallery--tile">
              <span class="ang-icon-gallery--previews">
                <mat-icon [fontSet]="fontSet" [title]="'Font: ' + icon.name">{{ icon.name }}</mat-icon>
                <mat-icon [svgIcon]="namespace + ':' + icon.name" [title]="'SVG: ' + icon.name" />
              </span>
              <code class="ang-icon-gallery--name">{{ icon.name }}</code>
              <button type="button" class="ang-icon-gallery--copy" (click)="copy(icon.name)">
                {{ copied() === icon.name ? 'Copied' : 'Copy name' }}
              </button>
            </li>
          }
        </ul>
      </section>
    } @empty {
      <p>No icons found. Run <code>npx nx build icons</code> to build the icon package.</p>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .ang-icon-gallery--search {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .ang-icon-gallery--category-title {
      text-transform: capitalize;
    }

    .ang-icon-gallery--grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
      gap: 1rem;
      padding: 0;
      list-style: none;
    }

    .ang-icon-gallery--tile {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: center;
      padding: 1rem;
      border: 1px solid currentColor;
      border-radius: 0.5rem;
    }

    .ang-icon-gallery--previews {
      display: flex;
      gap: 1rem;
    }
  `,
})
class IconGallery {
  /** Icons from the manifest. */
  readonly icons = input<IconEntry[]>([]);

  /** Font set alias used by the font previews. */
  protected readonly fontSet = ANG_ICONS_FONT_SET;

  /** Namespace used by the SVG previews. */
  protected readonly namespace = ANG_ICONS_NAMESPACE;

  /** Current search text. */
  protected readonly query = signal('');

  /** Name of the most recently copied icon. */
  protected readonly copied = signal<string | undefined>(undefined);

  /** Icons matching the search, grouped by category. */
  protected readonly groups = computed<IconGroup[]>(() => {
    const query = this.query().trim().toLowerCase();
    const groups = new Map<string, IconEntry[]>();
    for (const icon of this.icons()) {
      if (icon.name.includes(query) || icon.category.includes(query)) {
        groups.set(icon.category, [...(groups.get(icon.category) ?? []), icon]);
      }
    }

    return [...groups].map(([category, icons]) => ({ category, icons }));
  });

  /**
   * Copies an icon name to the clipboard.
   *
   * @param name Icon name to copy.
   */
  protected async copy(name: string): Promise<void> {
    await navigator.clipboard?.writeText(name);
    this.copied.set(name);
  }
}

const meta: Meta = {
  title: 'Design System/Icons',
  decorators: [
    applicationConfig({ providers: [provideAngIcons({ spriteUrl: `${ICONS_BASE_URL}/sprite.svg` })] }),
    moduleMetadata({ imports: [IconGallery, MatIcon] }),
  ],
  loaders: [loadIcons],
  parameters: {
    docs: {
      description: {
        component: `
Icons from \`@atlasng/icons\`, registered with \`provideAngIcons\` from \`@atlasng/design-system/icons\`.

\`\`\`ts
import { provideAngIcons } from '@atlasng/design-system/icons';
import * as literals from '@atlasng/icons/literals';

provideAngIcons({ spriteUrl: 'assets/ang-icons/sprite.svg' }); // SVG sprite
provideAngIcons({ literals }); // or SVG literals, bundled with the app
\`\`\`

Load \`@atlasng/icons\` CSS for the font, e.g. \`"styles": ["node_modules/@atlasng/icons/index.css"]\`.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Every icon in the manifest, rendered with the font and the SVG sprite. */
export const Gallery: Story = {
  render: (_args, { loaded }) => ({
    props: { icons: loaded['icons'] },
    template: `<ang-icon-gallery [icons]="icons" />`,
  }),
};

/** The three ways to render an icon with `mat-icon`. */
export const Usage: Story = {
  parameters: {
    docs: {
      description: {
        story: `
- Font ligature: \`<mat-icon fontSet="ang-icons" fontIcon="name" />\` or \`<mat-icon fontSet="ang-icons">name</mat-icon>\` (needs the \`@atlasng/icons\` CSS)
- SVG sprite: \`<mat-icon svgIcon="ang:name" />\` with \`provideAngIcons({ spriteUrl })\`
- SVG literal: \`<mat-icon svgIcon="ang:name" />\` with \`provideAngIcons({ literals })\`
        `,
      },
    },
  },
  render: (_args, { loaded }) => ({
    props: { name: (loaded['icons'] as IconEntry[])[0]?.name ?? '' },
    template: `
      <p><mat-icon fontSet="ang-icons">{{ name }}</mat-icon> <code>&lt;mat-icon fontSet="ang-icons"&gt;{{ name }}&lt;/mat-icon&gt;</code></p>
      <p><mat-icon [svgIcon]="'ang:' + name" /> <code>&lt;mat-icon svgIcon="ang:{{ name }}" /&gt;</code></p>
    `,
  }),
};
