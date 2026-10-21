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

The version control panel is always displayed; with no versions its selector is disabled. Other parts of the page can be turned off with a boolean input. All default to `true`, and a part is also hidden when it has no data.

| Input                | Hides or changes                   |
| -------------------- | ---------------------------------- |
| `showBreadcrumbs`    | Breadcrumbs                        |
| `showIcons`          | Icons above the title              |
| `showUrl`            | URL link snippet                   |
| `underlinedSections` | Divider beneath each section title |

### Section content

A section is `{ title, blocks }`. Each block is one of:

| Block                         | Renders                                                            |
| ----------------------------- | ------------------------------------------------------------------ |
| `{ type: 'text', content }`   | A paragraph. `content` is a string or a list of strings and links. |
| `{ type: 'image', src, alt }` | An image spanning the full content width.                          |
| `{ type: 'chips', labels }`   | A group of non-interactive chips, for example tags.                |

A link inside a text block is `{ text, link, external? }`. `link` accepts any `AnyLinkCommand`, and `external: true` opens it in a new tab.

```ts
const sections: MetadataSection[] = [
  { title: 'Description', blocks: [{ type: 'text', content: 'A description of the entry.' }] },
  {
    title: 'License',
    blocks: [
      {
        type: 'text',
        content: [
          'CC BY 4.0 (',
          { text: 'license', link: 'https://creativecommons.org/licenses/by/4.0/', external: true },
          ')',
        ],
      },
    ],
  },
  { title: 'Tags', blocks: [{ type: 'chips', labels: ['Heart', 'Kidney'] }] },
];
```

### Downloads

The page does not download files. Choosing a download option emits `download` with `{ item, format }`, and the consumer performs the download. Extend `VersionControlFileFormat` with your own fields, such as a URL, to get them back in the event.

### Responsive layout

- Below the `medium` breakpoint (960px), the page is a single column with 20px side padding, and the version control panel follows the first section.
- From `medium` up, the version control panel is a 400px column beside the sections, with 40px padding. The layout is centered and at most 1600px wide.

Colors and typography come from the active Material theme, so the page follows the WPP light and dark themes.

## Development

| Task      | Command                        |
| --------- | ------------------------------ |
| Build     | `npx nx build kg-explorer`     |
| Test      | `npx nx test kg-explorer`      |
| Lint      | `npx nx lint kg-explorer`      |
| Storybook | `npx nx storybook kg-explorer` |
