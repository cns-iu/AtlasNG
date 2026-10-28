import { ContentNode } from '@atlasng/content-blocks/types';
import {
  CSV_FILE_FORMAT,
  JSON_FILE_FORMAT,
  JSON_LD_FILE_FORMAT,
  N_QUADS_FILE_FORMAT,
  N_TRIPLES_FILE_FORMAT,
  RDF_XML_FILE_FORMAT,
  TURTLE_FILE_FORMAT,
  VersionControlFileFormat,
  VersionControlItem,
} from '@atlasng/design-system/version-control';
import { HeaderShell, HeaderShellNavigationItem, NavigationContainer } from '@atlasng/labs/header-shell';
import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { MetadataPage, MetadataSection } from './metadata-page';

const DESCRIPTION =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore ' +
  'magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo ' +
  'consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla ' +
  'pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est ' +
  'laborum.';

/**
 * Creates a paragraph node.
 *
 * @param content Paragraph content.
 * @returns The paragraph node.
 */
function paragraph(content: ContentNode | ContentNode[]): ContentNode {
  return { component: 'ContentParagraph', content };
}

/**
 * Creates a link node.
 *
 * @param text Link text.
 * @param href Link destination.
 * @returns The link node.
 */
function link(text: string, href: string): ContentNode {
  return { component: 'TextLink', config: { href }, content: text };
}

const SECTIONS: MetadataSection[] = [
  {
    title: 'Description',
    content: [
      paragraph(DESCRIPTION),
      {
        component: 'MetadataImage',
        config: {
          src: 'assets/illustration-placeholder.svg',
          alt: 'Placeholder illustration of the cardiovascular system',
        },
      },
    ],
  },
  { title: 'Creator(s)', content: [paragraph(link('Jacob C. Scherba', 'https://www.example.com'))] },
  { title: 'Project lead(s)', content: paragraph(link('Katy Börner', 'https://www.example.com')) },
  { title: 'Internal reviewer(s)', content: paragraph(link('Rajan Jain', 'https://www.example.com')) },
  { title: 'Date published', content: paragraph('2026-08-11') },
  { title: 'Date last processed', content: paragraph('2026-08-11') },
  { title: 'Publisher', content: paragraph('Whole Person Physiome') },
  { title: 'Funder', content: paragraph('National Institutes of Health (Award number U24AT013504)') },
  {
    title: 'License',
    content: paragraph([
      'Creative Commons Attribution 4.0 International (',
      link('CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/'),
      ')',
    ]),
  },
  { title: 'Tags', content: { component: 'MetadataChips', config: { labels: ['WPP table', 'Heart', 'Kidney'] } } },
];

const VERSIONS: VersionControlItem<VersionControlFileFormat>[] = [
  {
    label: 'v0.0',
    formats: [
      CSV_FILE_FORMAT,
      JSON_FILE_FORMAT,
      TURTLE_FILE_FORMAT,
      JSON_LD_FILE_FORMAT,
      RDF_XML_FILE_FORMAT,
      N_TRIPLES_FILE_FORMAT,
      N_QUADS_FILE_FORMAT,
    ],
  },
];

const meta: Meta<MetadataPage> = {
  title: 'Applications/KG Explorer/Metadata Page',
  component: MetadataPage,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/bSpc6bQC5nGwDaWJfx7Cen/CNS-Projects-2026?node-id=3037-219946',
    },
    layout: 'fullscreen',
  },
  argTypes: {
    download: { table: { disable: true } },
  },
  args: {
    title: 'Whole Person Physiome (WPP) table for cardiovascular system',
    breadcrumbs: [
      { name: 'Home', command: '/' },
      { name: 'Knowledge Graph Explorer', command: '/kg-explorer' },
      { name: 'Whole Person Physiome (WPP) table for cardiovascular system' },
    ],
    icons: [
      { src: 'assets/product-icon-placeholder.svg', alt: 'Knowledge graph' },
      { src: 'assets/organ-icon-placeholder.svg', alt: 'Heart' },
    ],
    url: 'https://purl.wholepersonphysiome.org/wpp/cardiovascular-system',
    sections: SECTIONS,
    versions: VERSIONS,
    versionControlTagline: 'Digital object version',
    sectionHeadingLevel: 2,
    showBreadcrumbs: true,
    showIcons: true,
    showUrl: true,
    underlinedSections: true,
  },
  render: (args) => ({
    props: args,
    template: `<ang-metadata-page ${argsToTemplate(args, { exclude: ['download'] })} />`,
  }),
};

export default meta;
type Story = StoryObj<MetadataPage>;

/** Metadata page with sample WPP data. */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('heading', {
        level: 1,
        name: 'Whole Person Physiome (WPP) table for cardiovascular system',
      }),
    ).toBeVisible();
    await expect(canvas.getByText('Digital object version')).toBeVisible();
    await expect(await canvas.findByRole('link', { name: 'CC BY 4.0' })).toBeVisible();
  },
};

const NAVIGATION_ITEMS: HeaderShellNavigationItem[] = [
  { id: 'kg-explorer', label: 'Knowledge Graph Explorer' },
  { id: 'about', label: 'About' },
];

/** Metadata page displayed below the application header. */
export const WithHeader: Story = {
  decorators: [moduleMetadata({ imports: [HeaderShell, NavigationContainer] })],
  render: (args) => ({
    props: { ...args, navigationItems: NAVIGATION_ITEMS },
    template: `
      <ang-header-shell
        logoUrl="assets/illustration-placeholder.svg"
        hasLocalNavigation="true"
        [navigationItems]="navigationItems"
        [localNavigationExpanded]="navigation.leftMenuOpen()"
        (localNavigationToggle)="navigation.localNavigationToggle()"
        (appsMenuToggle)="navigation.appsMenuToggle()"
      >
      </ang-header-shell>

      <ang-navigation-container
        [navigationItems]="navigationItems"
        [navRight]="navRight"
        [email]="email"
        [socialMediaIds]="socialMediaIds"
        #navigation
      >
        <main id="main-content">
          <ang-metadata-page ${argsToTemplate(args, { exclude: ['download'] })} />
        </main>
      </ang-navigation-container>
    `,
    styles: [`ang-header-shell {img{height: 100%;}}`],
  }),
};
