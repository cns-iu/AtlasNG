import { MatButtonModule } from '@angular/material/button';
import { Breadcrumbs, type BreadcrumbItem } from '@atlasng/design-system/buttons/breadcrumbs';
import { ContentHeader } from '@atlasng/design-system/content/content-header';
import { ContentParagraph } from '@atlasng/design-system/content/content-paragraph';
import { ContentSection } from '@atlasng/design-system/content/content-section';
import { LinkSnippet } from '@atlasng/design-system/links/link-snippet';
import { TableOfContents, type TableOfContentsItem } from '@atlasng/design-system/table-of-contents';
import {
  CSV_FILE_FORMAT,
  JSON_LD_GRAPH_DATA_FILE_FORMAT,
  TURTLE_FILE_FORMAT,
  VersionControl,
  type VersionControlFileFormat,
  type VersionControlItem,
} from '@atlasng/design-system/version-control';
import { type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';
import { PageLayout, PageLayoutEnd, PageLayoutHeader, PageLayoutIntro, PageLayoutSidePanel } from './page-layout';

/** Breadcrumb trail for the example page. */
const CRUMBS: BreadcrumbItem[] = [{ name: 'Home', command: '/' }, { name: 'Label' }];

/** Example page sections, which also drive the table of contents. */
const SECTIONS: TableOfContentsItem[] = [
  { tagline: 'Section label', level: 2, anchor: 'section-1' },
  { tagline: 'Section label', level: 3, anchor: 'section-2' },
  { tagline: 'Section label', level: 2, anchor: 'section-3' },
  { tagline: 'Section label', level: 3, anchor: 'section-4' },
];

/** Example versions for the metadata page's version control. */
const VERSIONS: VersionControlItem<VersionControlFileFormat>[] = [
  { label: '2.1.0', formats: [CSV_FILE_FORMAT, JSON_LD_GRAPH_DATA_FILE_FORMAT, TURTLE_FILE_FORMAT] },
  { label: '2.0.0', formats: [CSV_FILE_FORMAT, TURTLE_FILE_FORMAT] },
];

/** Placeholder section body text. */
const LOREM =
  'Lorem ipsum dolor sit amet consectetur adipiscing elit. Consectetur adipiscing elit quisque faucibus ex sapien ' +
  'vitae. Ex sapien vitae pellentesque sem placerat in id. Placerat in id cursus mi pretium tellus duis. Pretium ' +
  'tellus duis convallis tempus leo eu aenean.';

/** Page header markup shared by the stories. */
const HEADER = `
  <div angPageLayoutHeader style="display: flex; flex-direction: column; gap: 2rem;">
    <ang-breadcrumbs [items]="crumbs" />
    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
      <ang-content-header tagline="Page label" level="1" />
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <ang-content-paragraph>Short description of content less than 125 characters.</ang-content-paragraph>
        <div style="display: flex; flex-wrap: wrap; gap: 1rem;">
          <button mat-flat-button>Action</button>
          <button mat-stroked-button>Action</button>
        </div>
      </div>
    </div>
  </div>
`;

/** Page sections markup shared by the stories. */
const SECTIONS_TEMPLATE = `
  @for (section of sections; track section.anchor) {
    <ang-content-section [tagline]="section.tagline" [level]="section.level" [id]="section.anchor">
      <ang-content-paragraph>{{ lorem }}</ang-content-paragraph>
    </ang-content-section>
  }
`;

/** Last updated line shared by the stories. */
const END = `
  <p angPageLayoutEnd style="margin: 0; font: var(--mat-sys-body-medium); font-weight: 600;
    color: var(--mat-sys-on-surface-variant);">
    Last updated on November 9, 2026
  </p>
`;

const meta: Meta<PageLayout> = {
  component: PageLayout,
  title: 'Design System/Page Layout',
  parameters: {
    layout: 'fullscreen',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=4917-23208',
    },
  },
  decorators: [
    moduleMetadata({
      imports: [
        PageLayoutHeader,
        PageLayoutIntro,
        PageLayoutSidePanel,
        PageLayoutEnd,
        Breadcrumbs,
        ContentHeader,
        ContentParagraph,
        ContentSection,
        LinkSnippet,
        TableOfContents,
        VersionControl,
        MatButtonModule,
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj<PageLayout>;

/**
 * A white label content page: breadcrumbs, the page label, and actions in the page header, page sections in the
 * main slot, a table of contents in the side panel, and the last updated date at the end. The application shell
 * adds the header shell above the layout and the footer below it.
 */
export const ContentPage: Story = {
  render: () => ({
    props: { crumbs: CRUMBS, sections: SECTIONS, lorem: LOREM, activeItem: SECTIONS[0] },
    template: `
      <ang-page-layout>
        ${HEADER}
        <ang-table-of-contents angPageLayoutSidePanel [items]="sections" [activeItem]="activeItem" />
        ${SECTIONS_TEMPLATE}
        ${END}
      </ang-page-layout>
    `,
  }),
};

/** Without a side panel, the main content keeps the same width on wide screens. */
export const WithoutSidePanel: Story = {
  render: () => ({
    props: { crumbs: CRUMBS, sections: SECTIONS, lorem: LOREM },
    template: `
      <ang-page-layout>
        ${HEADER}
        ${SECTIONS_TEMPLATE}
        ${END}
      </ang-page-layout>
    `,
  }),
};

/**
 * A metadata page: breadcrumbs, the page label, and a copyable URL in the page header, the first section in the
 * intro, and version control in a wide side panel. On narrow screens, version control follows the first section.
 */
export const MetadataPage: Story = {
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=8698-11558',
    },
  },
  render: () => ({
    props: { crumbs: CRUMBS, sections: SECTIONS, lorem: LOREM, versions: VERSIONS, selectedVersion: VERSIONS[0] },
    template: `
      <ang-page-layout sidePanelWidth="wide">
        <div angPageLayoutHeader style="display: flex; flex-direction: column; gap: 2rem;">
          <ang-breadcrumbs [items]="crumbs" />
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <ang-content-header tagline="Page label" level="1" />
            <ang-link-snippet url="https://example.org/schema/page-label/2.1.0" />
          </div>
        </div>
        <ang-content-section angPageLayoutIntro tagline="Summary" [level]="2">
          <ang-content-paragraph>{{ lorem }}</ang-content-paragraph>
        </ang-content-section>
        <ang-version-control
          angPageLayoutSidePanel
          tagline="Download"
          [versions]="versions"
          [(selectedVersion)]="selectedVersion"
        />
        ${SECTIONS_TEMPLATE}
        ${END}
      </ang-page-layout>
    `,
  }),
};
