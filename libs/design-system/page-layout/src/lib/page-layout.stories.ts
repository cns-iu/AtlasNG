import { MatButtonModule } from '@angular/material/button';
import { Breadcrumbs, type BreadcrumbItem } from '@atlasng/design-system/buttons/breadcrumbs';
import { ContentHeader } from '@atlasng/design-system/content/content-header';
import { ContentParagraph } from '@atlasng/design-system/content/content-paragraph';
import { ContentSection } from '@atlasng/design-system/content/content-section';
import { LinkSnippet } from '@atlasng/design-system/links/link-snippet';
import { TableOfContents, type TableOfContentsItem } from '@atlasng/design-system/table-of-contents';
import {
  CSV_FILE_FORMAT,
  JSON_FILE_FORMAT,
  JSON_LD_FILE_FORMAT,
  N_QUADS_FILE_FORMAT,
  N_TRIPLES_FILE_FORMAT,
  RDF_XML_FILE_FORMAT,
  TURTLE_FILE_FORMAT,
  VersionControl,
  type VersionControlFileFormat,
  type VersionControlItem,
} from '@atlasng/design-system/version-control';
import { Controls, Description, DocsStory, Stories, Subtitle, Title } from '@storybook/addon-docs/blocks';
import { type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';
import { createElement, Fragment } from 'react';
import { PageLayout, PageLayoutEnd, PageLayoutHeader, PageLayoutIntro, PageLayoutSidePanel } from './page-layout';

/** A page section and its paragraph. Content pages also list the sections in the table of contents. */
type PageSection = TableOfContentsItem & { text: string };

/** Text that fills a content page. */
interface ContentPageText {
  /** Breadcrumb trail. */
  crumbs: BreadcrumbItem[];
  /** Page label. */
  label: string;
  /** Page description. */
  description: string;
  /** Labels of the primary and secondary actions. */
  actions: [string, string];
  /** Page sections. The first one shows the placeholder image. */
  sections: PageSection[];
  /** Alt text for the placeholder image. */
  imageAlt: string;
  /** Last updated line at the end of the page. */
  lastUpdated: string;
}

/** Placeholder section body text. */
const LOREM =
  'Lorem ipsum dolor sit amet consectetur adipiscing elit. Consectetur adipiscing elit quisque faucibus ex sapien ' +
  'vitae. Ex sapien vitae pellentesque sem placerat in id. Placerat in id cursus mi pretium tellus duis. Pretium ' +
  'tellus duis convallis tempus leo eu aenean.';

/** Figma's default component labels, shown at the top of the docs page so it matches the Figma frames. */
const FIGMA_LABELS: ContentPageText = {
  crumbs: [{ name: 'Home', command: '/' }, { name: 'Label' }],
  label: 'Page label',
  description: 'Short description of content less than 125 characters.',
  actions: ['Action', 'Action'],
  sections: [
    { tagline: 'Section label', level: 2, anchor: 'section-1', text: LOREM },
    { tagline: 'Section label', level: 3, anchor: 'section-2', text: LOREM },
    { tagline: 'Section label', level: 2, anchor: 'section-3', text: LOREM },
    { tagline: 'Section label', level: 3, anchor: 'section-4', text: LOREM },
  ],
  imageAlt: 'Placeholder image',
  lastUpdated: 'Last updated on November 9, 2026',
};

/** Realistic, brand-neutral example content page, for previewing the layout in any brand. */
const EXAMPLE_CONTENT_PAGE: ContentPageText = {
  crumbs: [{ name: 'Home', command: '/' }, { name: 'Resources' }],
  label: 'Resources',
  description: 'Browse documents, videos, and tutorials about our data and tools.',
  actions: ['View glossary', 'Watch tutorials'],
  sections: [
    {
      tagline: 'Documents',
      level: 2,
      anchor: 'documents',
      text: 'Reference documents for our data and tools, openly available through a public repository.',
    },
    {
      tagline: 'Glossary',
      level: 3,
      anchor: 'glossary',
      text: 'Definitions of the terms used across our data tables, documentation, and tools.',
    },
    {
      tagline: 'Standard operating procedure',
      level: 3,
      anchor: 'standard-operating-procedure',
      text:
        'How our data is created, reviewed, and published, with timelines and goals for each release. This living ' +
        'document is updated as the project evolves, so check back before starting a new contribution.',
    },
    { tagline: 'Videos', level: 2, anchor: 'videos', text: 'Watch presentations and tutorials from the team.' },
    {
      tagline: 'Introduction to the data tables',
      level: 3,
      anchor: 'introduction-to-the-data-tables',
      text: 'A short tour of the data tables: what they contain, how they are organized, and how to download them.',
    },
    {
      tagline: 'Exploring the knowledge graph',
      level: 3,
      anchor: 'exploring-the-knowledge-graph',
      text: 'A walkthrough of the knowledge graph, from searching for a term to downloading the results.',
    },
    {
      tagline: 'Annual meeting highlights',
      level: 3,
      anchor: 'annual-meeting-highlights',
      text:
        "Highlights from this year's annual meeting, including project updates, invited talks, and a panel with " +
        'partner organizations.',
    },
  ],
  imageAlt: 'Cover pages of the reference documents',
  lastUpdated: 'Last updated on October 28, 2026',
};

/** Breadcrumb trail for the example metadata page. */
const METADATA_CRUMBS: BreadcrumbItem[] = [
  { name: 'Home', command: '/' },
  { name: 'Datasets', command: '/datasets' },
  { name: 'Cell types of the human heart' },
];

/** Example metadata page sections after the intro. */
const METADATA_SECTIONS: PageSection[] = [
  { tagline: 'Creator(s)', level: 2, anchor: 'creators', text: 'Jordan Lee, Priya Natarajan' },
  { tagline: 'Project lead(s)', level: 2, anchor: 'project-leads', text: 'Sam Okafor' },
  { tagline: 'Internal reviewer(s)', level: 2, anchor: 'internal-reviewers', text: 'Morgan Chen' },
  { tagline: 'Date published', level: 2, anchor: 'date-published', text: '2026-10-28' },
  { tagline: 'Publisher', level: 2, anchor: 'publisher', text: 'Research Data Consortium' },
  { tagline: 'Funder', level: 2, anchor: 'funder', text: 'Example Science Foundation (Award number ESF-2026-0142)' },
  {
    tagline: 'License',
    level: 2,
    anchor: 'license',
    text: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
  },
];

/** Every download format, offered for the example dataset's 2.x versions. */
const ALL_FORMATS: VersionControlFileFormat[] = [
  CSV_FILE_FORMAT,
  JSON_FILE_FORMAT,
  TURTLE_FILE_FORMAT,
  JSON_LD_FILE_FORMAT,
  RDF_XML_FILE_FORMAT,
  N_TRIPLES_FILE_FORMAT,
  N_QUADS_FILE_FORMAT,
];

/** Download formats offered for the example dataset's 1.x versions. */
const EARLY_FORMATS: VersionControlFileFormat[] = [CSV_FILE_FORMAT, JSON_FILE_FORMAT, TURTLE_FILE_FORMAT];

/** Versions of the example dataset, newest first. */
const VERSIONS: VersionControlItem<VersionControlFileFormat>[] = [
  { label: 'v2.1.0', formats: ALL_FORMATS },
  { label: 'v2.0.0', formats: ALL_FORMATS },
  { label: 'v1.3.0', formats: EARLY_FORMATS },
  { label: 'v1.2.0', formats: EARLY_FORMATS },
  { label: 'v1.1.0', formats: EARLY_FORMATS },
  { label: 'v1.0.0', formats: EARLY_FORMATS },
];

/** Placeholder image attributes, shared by the stories. */
const IMAGE = `src="assets/illustration-placeholder.svg" style="display: block; width: 100%; height: auto;"`;

/** Last updated line shared by the stories. */
const END = `
  <p angPageLayoutEnd style="margin: 0; font: var(--mat-sys-body-medium); font-weight: 600;
    color: var(--mat-sys-on-surface-variant);">
    {{ page.lastUpdated }}
  </p>
`;

/**
 * Renders a content page.
 *
 * @param page Text that fills the page.
 * @param withSidePanel Whether to show the table of contents in the side panel.
 * @returns The story's props and template.
 */
function renderContentPage(page: ContentPageText, withSidePanel: boolean) {
  return {
    props: { page, activeItem: page.sections[0] },
    template: `
      <ang-page-layout>
        <div angPageLayoutHeader style="display: flex; flex-direction: column; gap: 2rem;">
          <ang-breadcrumbs [items]="page.crumbs" />
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <ang-content-header [tagline]="page.label" level="1" />
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
              <ang-content-paragraph>{{ page.description }}</ang-content-paragraph>
              <div style="display: flex; flex-wrap: wrap; gap: 1rem;">
                <button mat-flat-button>{{ page.actions[0] }}</button>
                <button mat-stroked-button>{{ page.actions[1] }}</button>
              </div>
            </div>
          </div>
        </div>
        ${withSidePanel ? '<ang-table-of-contents angPageLayoutSidePanel [items]="page.sections" [activeItem]="activeItem" />' : ''}
        @for (section of page.sections; track section.anchor; let first = $first) {
          <ang-content-section [tagline]="section.tagline" [level]="section.level" [id]="section.anchor">
            <ang-content-paragraph>{{ section.text }}</ang-content-paragraph>
            @if (first) {
              <img ${IMAGE} [alt]="page.imageAlt" />
            }
          </ang-content-section>
        }
        ${END}
      </ang-page-layout>
    `,
  };
}

const meta: Meta<PageLayout> = {
  component: PageLayout,
  title: 'Design System/Page Layout',
  parameters: {
    layout: 'fullscreen',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=4917-23208',
    },
    docs: {
      page: DocsPage,
      description: {
        component: `
Lays out a page body. Pages fill its slots; the layout owns the grid, maximum width, padding, breakpoints, and sticky side panel.

| Slot | Mark content with | Holds | Below \`medium\` |
| --- | --- | --- | --- |
| Page header | \`angPageLayoutHeader\` | Breadcrumbs, page label, description, actions | First |
| Intro | \`angPageLayoutIntro\` | A metadata page's first section and data preview | After the page header |
| Side panel | \`angPageLayoutSidePanel\` | Table of contents or version control | After the intro |
| Main | Unmarked content | Page sections | After the side panel |
| End | \`angPageLayoutEnd\` | Last updated date | Last |

Set \`sidePanelWidth\` to match the side panel's content:

| | Table of contents (\`default\`) | Version control (\`wide\`) |
| --- | --- | --- |
| Side panel width | 208–268px | 280–400px |
| Main content width at 960px | 640px | 560px |
| Main content width at 1600px | 1220px | 1080px |
| Space between main content and side panel | 56px | 40px |
| Side panel's distance from the page's right edge | 16px | 40px |
| When taller than the window | The side panel scrolls | Download options scroll; the version picker stays in view |

Below 960px (\`medium\`), the page is one column with 20px side padding. From 960px, the side panel sits beside the main content, which has 40px side padding. As the page widens:

1. The main content grows to 640px.
2. The side panel grows to its maximum width.
3. The main content takes the rest, up to the page's 1600px maximum width, which includes the side padding.

Sections are 40px apart, with 40px above and below the page.

- Wrap the layout in the app's \`main\` element; it adds no landmarks.
- Don't add another max width or side padding around it. Line up heroes and footers with the \`page-container\` mixin.
- Under a sticky header, set \`side-panel-sticky-top\` to the header's height.

The preview below uses Figma's default labels. The stories after it use example content, for previewing the layout in each brand.
        `,
      },
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
 * A white label content page: breadcrumbs, the page label, a description, and actions in the page header, page
 * sections in the main slot, a table of contents in the side panel, and the last updated date at the end. The
 * application shell adds the header shell above the layout and the footer below it.
 */
export const ContentPage: Story = {
  render: () => renderContentPage(EXAMPLE_CONTENT_PAGE, true),
};

/** Without a side panel, the main content keeps the same width on wide screens. */
export const WithoutSidePanel: Story = {
  render: () => renderContentPage(EXAMPLE_CONTENT_PAGE, false),
};

/**
 * A metadata page: breadcrumbs, the page label, and a copyable URL in the page header, the first section and a data
 * preview in the intro, and version control in a wide side panel. On narrow screens, version control follows the
 * intro.
 */
export const MetadataPage: Story = {
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=8698-11558',
    },
  },
  render: () => ({
    props: {
      page: { lastUpdated: 'Last updated on October 28, 2026' },
      crumbs: METADATA_CRUMBS,
      sections: METADATA_SECTIONS,
      versions: VERSIONS,
      selectedVersion: VERSIONS[0],
    },
    template: `
      <ang-page-layout sidePanelWidth="wide">
        <div angPageLayoutHeader style="display: flex; flex-direction: column; gap: 2rem;">
          <ang-breadcrumbs [items]="crumbs" />
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <ang-content-header tagline="Cell types of the human heart" level="1" />
            <ang-link-snippet url="https://purl.example.org/datasets/heart-cell-types" />
          </div>
        </div>
        <ang-content-section angPageLayoutIntro tagline="Description" [level]="2">
          <ang-content-paragraph>
            A table of the cell types found in the human heart, organized by anatomical structure, with the biomarkers
            used to identify each cell type. Use it to compare cell types across studies or to annotate new data.
          </ang-content-paragraph>
        </ang-content-section>
        <img angPageLayoutIntro ${IMAGE} alt="Preview of the heart cell types table" />

        <ang-version-control
          angPageLayoutSidePanel
          tagline="Dataset version"
          [versions]="versions"
          [(selectedVersion)]="selectedVersion"
        />
        @for (section of sections; track section.anchor) {
          <ang-content-section [tagline]="section.tagline" [level]="section.level" [id]="section.anchor">
            <ang-content-paragraph>{{ section.text }}</ang-content-paragraph>
          </ang-content-section>
        }
        ${END}
      </ang-page-layout>
    `,
  }),
};

/**
 * A content page with Figma's default labels, shown at the top of the docs page. It's hidden from the sidebar and the
 * docs page's Stories list, and it's last so the docs page keeps the first story's tags.
 */
export const Anatomy: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => renderContentPage(FIGMA_LABELS, true),
};

/**
 * Storybook's default docs page, with the {@link Anatomy} story as the main preview instead of the first story. The
 * main preview is the same `DocsStory` block that the default page uses, so the background picker still applies.
 *
 * @returns The docs page.
 */
function DocsPage() {
  return createElement(
    Fragment,
    null,
    createElement(Title),
    createElement(Subtitle),
    createElement(Description),
    createElement(DocsStory, { of: Anatomy, expanded: false, withToolbar: true }),
    createElement(Controls, { of: Anatomy }),
    createElement(Stories),
  );
}
