import { NgTemplateOutlet } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { AnyLink, AnyLinkCommand } from '@atlasng/common';
import { BreadcrumbItem, Breadcrumbs } from '@atlasng/design-system/buttons/breadcrumbs';
import { ContentParagraph } from '@atlasng/design-system/content/content-paragraph';
import { ContentSection } from '@atlasng/design-system/content/content-section';
import { Heading } from '@atlasng/design-system/content/heading';
import { LinkSnippet } from '@atlasng/design-system/links/link-snippet';
import { TextLink } from '@atlasng/design-system/links/text-link';
import {
  VersionControl,
  VersionControlFileFormat,
  VersionControlItem,
  VersionDownload,
} from '@atlasng/design-system/version-control';

/** A link displayed inline within a text block. */
export interface MetadataLink {
  /** Displayed link text. */
  text: string;
  /** Link destination. */
  link: AnyLinkCommand;
  /** Whether the link opens in a new tab. */
  external?: boolean;
}

/** Inline content of a text block: plain text or a link. */
export type MetadataInline = string | MetadataLink;

/** A paragraph of text with optional inline links. */
export interface MetadataTextBlock {
  /** Block discriminator. */
  type: 'text';
  /** Paragraph content. A string is rendered as plain text. */
  content: string | MetadataInline[];
}

/** An image displayed within a section. */
export interface MetadataImageBlock {
  /** Block discriminator. */
  type: 'image';
  /** Image source URL. */
  src: string;
  /** Alternative text describing the image. Use an empty string for decorative images. */
  alt: string;
}

/** A group of non-interactive chips, for example tags. */
export interface MetadataChipsBlock {
  /** Block discriminator. */
  type: 'chips';
  /** Chip labels, in display order. */
  labels: string[];
}

/** A piece of content displayed within a metadata section. */
export type MetadataBlock = MetadataTextBlock | MetadataImageBlock | MetadataChipsBlock;

/** A titled section of the metadata page. */
export interface MetadataSection {
  /** Section heading. */
  title: string;
  /** Section content, in display order. */
  blocks: MetadataBlock[];
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
 * On narrow screens the version control panel follows the first section; from the medium breakpoint up it is
 * displayed in a column beside the sections.
 *
 * The page does not download files itself. Choosing a download option emits {@link MetadataPage.download},
 * and the consumer performs the download.
 */
@Component({
  selector: 'ang-metadata-page',
  imports: [
    AnyLink,
    Breadcrumbs,
    ContentParagraph,
    ContentSection,
    Heading,
    LinkSnippet,
    MatChipsModule,
    NgTemplateOutlet,
    TextLink,
    VersionControl,
  ],
  templateUrl: './metadata-page.html',
  styleUrl: './metadata-page.scss',
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

  /** First section, displayed before the version control panel on narrow screens. */
  protected readonly firstSection = computed(() => this.sections()[0]);
  /** Sections displayed after the version control panel on narrow screens. */
  protected readonly remainingSections = computed(() => this.sections().slice(1));

  /**
   * Normalizes text block content into a list of inline items.
   *
   * @param content - Text block content.
   * @returns The inline items to render.
   */
  protected toInlines(content: string | MetadataInline[]): MetadataInline[] {
    return typeof content === 'string' ? [content] : content;
  }
}
