import { NgTemplateOutlet } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { ContentBlock } from '@atlasng/content-blocks';
import { provideDefinitions } from '@atlasng/content-blocks/definitions';
import { provideDesignSystemDefinitions } from '@atlasng/content-blocks/definitions/design-system';
import { CONTENT_DOCUMENT_VERSION, ContentDocument } from '@atlasng/content-blocks/types';
import { BreadcrumbItem, Breadcrumbs } from '@atlasng/design-system/buttons/breadcrumbs';
import { ContentSection } from '@atlasng/design-system/content/content-section';
import { Heading } from '@atlasng/design-system/content/heading';
import { LinkSnippet } from '@atlasng/design-system/links/link-snippet';
import {
  VersionControl,
  VersionControlFileFormat,
  VersionControlItem,
  VersionDownload,
} from '@atlasng/design-system/version-control';
import { METADATA_PAGE_DEFINITIONS } from './content/definitions';

/**
 * A titled section of the metadata page.
 *
 * The content is rendered with content blocks. Besides the design-system definitions, e.g. `ContentParagraph`, it can
 * use the {@link METADATA_PAGE_DEFINITIONS}: `MetadataImage` and `MetadataChips`.
 */
export interface MetadataSection {
  /** Section heading. */
  title: string;
  /** Section content nodes, in display order. */
  content: ContentDocument['content'];
}

/** A section prepared for rendering, with its content wrapped in a content document. */
interface MetadataSectionView {
  /** Section heading. */
  title: string;
  /** Content document rendered in the section body. */
  document: ContentDocument;
}

/** An icon displayed above the page title, for example a product or organ icon. */
export interface MetadataIcon {
  /** Icon image source URL. */
  src: string;
  /** Alternative text describing the icon. */
  alt: string;
}

/**
 * Page layout template that displays the metadata of a single data entry, such as a knowledge graph digital object.
 *
 * The page shows breadcrumbs, icons, a title, a copyable URL, a list of sections and an always-visible version control panel.
 * Section content is rendered with content blocks; the page registers the design-system and metadata page definitions.
 * On narrow screens the version control panel follows the first section; from the medium breakpoint up it is
 * displayed in a column beside the sections.
 *
 * The page does not download files itself. Choosing a download option emits {@link MetadataPage.download},
 * and the consumer performs the download.
 */
@Component({
  selector: 'ang-metadata-page',
  imports: [Breadcrumbs, ContentBlock, ContentSection, Heading, LinkSnippet, NgTemplateOutlet, VersionControl],
  templateUrl: './metadata-page.html',
  styleUrl: './metadata-page.scss',
  providers: [provideDesignSystemDefinitions(), provideDefinitions(METADATA_PAGE_DEFINITIONS)],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ang-metadata-page',
  },
})
export class MetadataPage<T extends VersionControlFileFormat = VersionControlFileFormat> {
  /** Page title. */
  readonly title = input.required<string>();
  /** Sections displayed below the title, in display order. */
  readonly sections = input.required<readonly MetadataSection[]>();
  /** Breadcrumb trail displayed above the icons and title. */
  readonly breadcrumbs = input<BreadcrumbItem[]>([]);
  /** Icons displayed above the title. */
  readonly icons = input<readonly MetadataIcon[]>([]);
  /** URL displayed in a copyable link snippet below the title. */
  readonly url = input<string>();
  /** Versions and their downloadable file formats. */
  readonly versions = input.required<readonly VersionControlItem<T>[]>();
  /** Heading of the version control panel. */
  readonly versionControlTagline = input('Digital object version');
  /** Heading level of the section titles. */
  readonly sectionHeadingLevel = input<number | string>(2);

  /** Whether to display the breadcrumbs. */
  readonly showBreadcrumbs = input(true, { transform: booleanAttribute });
  /** Whether to display the icons. */
  readonly showIcons = input(true, { transform: booleanAttribute });
  /** Whether to display the URL link snippet. */
  readonly showUrl = input(true, { transform: booleanAttribute });
  /** Whether to display a divider beneath each section title. */
  readonly underlinedSections = input(true, { transform: booleanAttribute });

  /** Selected version. Defaults to the first version. */
  readonly selectedVersion = model<VersionControlItem<T> | undefined>();
  /** Emits the version and file format whenever a download option is chosen. */
  readonly download = output<VersionDownload<T>>();

  /** Sections with their content wrapped in content documents, created once per sections change. */
  protected readonly sectionViews = computed(() =>
    this.sections().map((section): MetadataSectionView => ({
      title: section.title,
      document: { version: CONTENT_DOCUMENT_VERSION, content: section.content },
    })),
  );
  /** First section, displayed before the version control panel on narrow screens. */
  protected readonly firstSection = computed(() => this.sectionViews()[0]);
  /** Sections displayed after the version control panel on narrow screens. */
  protected readonly remainingSections = computed(() => this.sectionViews().slice(1));
}
