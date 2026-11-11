# @atlasng/kg-explorer

Application library for the AtlasNG knowledge graph explorer. It is in early development and does not yet have a stable public API.

## Metadata page

`ang-metadata-page` is a page layout template that displays the metadata of a single data entry, such as a knowledge graph digital object. It accepts plain data, so it works with any data source, and renders only the page body. Compose it with a header (for example `ang-header-shell` from `@atlasng/labs/header-shell`) and `ang-footer` from `@atlasng/design-system/footer`.

```html
<ang-metadata-page
  [title]="entry.title"
  [breadcrumbs]="breadcrumbs"
  [icons]="icons"
  [url]="entry.purl"
  [sections]="sections"
  [versions]="versions"
  (download)="downloadFile($event)"
/>
```

### Inputs

| Input                   | Default                    | Description                                                              |
| ----------------------- | -------------------------- | ------------------------------------------------------------------------ |
| `title`                 | required                   | Page title, rendered as the `h1`.                                        |
| `sections`              | required                   | `MetadataSection[]` rendered in order below the title.                   |
| `breadcrumbs`           | `[]`                       | `BreadcrumbItem[]` from `@atlasng/design-system/buttons/breadcrumbs`.    |
| `icons`                 | `[]`                       | `MetadataIcon[]` (`{ src, alt }`) shown as 64px circles above the title. |
| `url`                   | `undefined`                | URL shown in a copyable link snippet.                                    |
| `versions`              | required                   | `VersionControlItem[]` from `@atlasng/design-system/version-control`.    |
| `versionControlTagline` | `'Digital object version'` | Heading of the version control panel.                                    |
| `sectionHeadingLevel`   | `2`                        | Heading level of the section titles.                                     |
| `selectedVersion`       | first version              | Two-way bindable selected version.                                       |

The version control panel is always displayed; with no versions its selector is disabled. Other parts of the page can be changed with a boolean input. A part is also hidden when it has no data.

| Input                 | Default | Effect                                     |
| --------------------- | ------- | ------------------------------------------ |
| `breadcrumbsDisabled` | `false` | Hides the breadcrumbs                      |
| `iconsDisabled`       | `false` | Hides the icons above the title            |
| `urlDisabled`         | `false` | Hides the URL link snippet                 |
| `underlinedSections`  | `true`  | Shows a divider beneath each section title |

### Section content

A section is `{ title, content }`. `content` is one content-block node or a list of them, rendered with `ang-content-block` from `@atlasng/content-blocks`. The page registers these definitions:

| Component          | Source                                       | Renders                                             |
| ------------------ | -------------------------------------------- | --------------------------------------------------- |
| `ContentParagraph` | design-system definitions                    | A paragraph of text and inline nodes.               |
| `TextLink`         | design-system definitions                    | A link. `config.href` is the destination.           |
| `MetadataImage`    | `METADATA_PAGE_DEFINITIONS` (`{ src, alt }`) | An image spanning the full content width.           |
| `MetadataChips`    | `METADATA_PAGE_DEFINITIONS` (`{ labels }`)   | A group of non-interactive chips, for example tags. |

The other design-system definitions are available too.

```ts
const sections: MetadataSection[] = [
  {
    title: 'Description',
    content: [
      { component: 'ContentParagraph', content: 'A description of the entry.' },
      { component: 'MetadataImage', config: { src: 'assets/illustration.svg', alt: 'Illustration of the entry' } },
    ],
  },
  {
    title: 'License',
    content: {
      component: 'ContentParagraph',
      content: [
        'CC BY 4.0 (',
        { component: 'TextLink', config: { href: 'https://creativecommons.org/licenses/by/4.0/' }, content: 'license' },
        ')',
      ],
    },
  },
  { title: 'Tags', content: { component: 'MetadataChips', config: { labels: ['Heart', 'Kidney'] } } },
];
```

### Downloads

The page does not download files. Choosing a download option emits `download` with `{ item, format }`, and the consumer performs the download. Extend `VersionControlFileFormat` with your own fields, such as a URL, to get them back in the event.

### Responsive layout

- Below the `medium` breakpoint (960px), the page is a single column with 20px side padding, and the version control panel follows the first section.
- From `medium` up, the version control panel is a 400px column beside the sections, with 40px padding. The layout is centered and at most 1600px wide.

Spacing can be customized with these CSS variables:

| Variable                                     | Default  | Effect                                                                  |
| -------------------------------------------- | -------- | ----------------------------------------------------------------------- |
| `--ang-metadata-page-section-gap`            | `2.5rem` | Space between sections                                                  |
| `--ang-metadata-page-padding`                | `2.5rem` | Page padding from `medium` up                                           |
| `--ang-metadata-page-version-control-offset` | `0rem`   | Extra space kept clear above the sticky panel, e.g. for a sticky header |

Colors and typography come from the active Material theme, so the page follows the WPP light and dark themes.

## Development

| Task      | Command                        |
| --------- | ------------------------------ |
| Build     | `npx nx build kg-explorer`     |
| Test      | `npx nx test kg-explorer`      |
| Lint      | `npx nx lint kg-explorer`      |
| Storybook | `npx nx storybook kg-explorer` |
