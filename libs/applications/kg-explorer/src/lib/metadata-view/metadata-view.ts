import { NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
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
import { pickDefined } from '../utils/pick-defined';
import { KG_EXPLORER_METADATA_VIEW_CONFIG, type KgExplorerMetadataViewConfig } from './config';
import { KG_EXPLORER_METADATA_DEFINITIONS } from './definitions';

/**
 * A titled section of the metadata page.
 *
 * The content is rendered with content blocks. Besides the design-system definitions, e.g. `ContentParagraph`, it can
 * use the {@link KG_EXPLORER_METADATA_DEFINITIONS}: `MetadataImage` and `MetadataChips`.
 */
export interface KgExplorerMetadataSection {
  /** Section heading. */
  title: string;
  /** Section content nodes, in display order. */
  content: ContentDocument['content'];
}

/** A section prepared for rendering, with its content wrapped in a content document. */
interface KgExplorerMetadataSectionView {
  /** Section heading. */
  title: string;
  /** Content document rendered in the section body. */
  document: ContentDocument;
}

/** An icon displayed above the page title, for example a product or organ icon. */
export interface KgExplorerMetadataIcon {
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
 * Headings and visibility options are set through {@link KgExplorerMetadataView.config}, which is merged over the
 * defaults provided with `provideKgExplorerMetadataView`.
 *
 * The page does not download files itself. Choosing a download option emits {@link KgExplorerMetadataView.download},
 * and the consumer performs the download.
 */
@Component({
  selector: 'ang-kg-explorer-metadata-view',
  imports: [
    Breadcrumbs,
    ContentBlock,
    ContentSection,
    Heading,
    LinkSnippet,
    NgOptimizedImage,
    NgTemplateOutlet,
    VersionControl,
  ],
  templateUrl: './metadata-view.html',
  styleUrl: './metadata-view.scss',
  providers: [provideDesignSystemDefinitions(), provideDefinitions(KG_EXPLORER_METADATA_DEFINITIONS)],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ang-kg-explorer-metadata-view',
  },
})
export class KgExplorerMetadataView<T extends VersionControlFileFormat = VersionControlFileFormat> {
  /** Page title. */
  readonly title = input.required<string>();
  /** Sections displayed below the title, in display order. */
  readonly sections = input.required<readonly KgExplorerMetadataSection[]>();
  /** Breadcrumb trail displayed above the icons and title. */
  readonly breadcrumbs = input<BreadcrumbItem[]>([]);
  /** Icons displayed above the title. */
  readonly icons = input<readonly KgExplorerMetadataIcon[]>([]);
  /** URL displayed in a copyable link snippet below the title. */
  readonly url = input<string>();
  /** Versions and their downloadable file formats. */
  readonly versions = input.required<readonly VersionControlItem<T>[]>();
  /**
   * Headings and visibility options. Omitted options use the values provided
   * with `provideKgExplorerMetadataView` and then the built-in defaults.
   */
  readonly config = input<KgExplorerMetadataViewConfig>({});

  /** Selected version. Defaults to the first version. */
  readonly selectedVersion = model<VersionControlItem<T> | undefined>();
  /** Emits the version and file format whenever a download option is chosen. */
  readonly download = output<VersionDownload<T>>();

  /** Defaults provided with `provideKgExplorerMetadataView`, with the built-in defaults applied. */
  private readonly defaults = KG_EXPLORER_METADATA_VIEW_CONFIG.inject();

  /** The {@link config} input merged over the provided defaults. */
  protected readonly resolvedConfig = computed(() => ({ ...this.defaults, ...pickDefined(this.config()) }));

  /** Sections with their content wrapped in content documents, created once per sections change. */
  protected readonly sectionViews = computed(() =>
    this.sections().map((section): KgExplorerMetadataSectionView => ({
      title: section.title,
      document: { version: CONTENT_DOCUMENT_VERSION, content: section.content },
    })),
  );
  /** First section, displayed before the version control panel on narrow screens. */
  protected readonly firstSection = computed(() => this.sectionViews()[0]);
  /** Sections displayed after the version control panel on narrow screens. */
  protected readonly remainingSections = computed(() => this.sectionViews().slice(1));
}
