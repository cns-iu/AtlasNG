import { Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { Breadcrumbs, BreadcrumbItem } from '@atlasng/design-system/buttons/breadcrumbs';
import { Heading } from '@atlasng/design-system/content/heading';
import {
  CookieBanner,
  CookieBannerAction,
  CookieBannerDescription,
  CookieBannerPrivacyPolicy,
  CookieBannerTitle,
} from '@atlasng/design-system/cookie-banner';
import { Footer } from '@atlasng/design-system/footer';
import { Notice } from '@atlasng/design-system/indicators/notice';
import { Skeleton } from '@atlasng/design-system/indicators/skeleton';
import { TextLink } from '@atlasng/design-system/links/text-link';
import { ScrollArea } from '@atlasng/design-system/scroll-area';
import { SearchField } from '@atlasng/design-system/search-field';
import { SearchList, SearchListOption } from '@atlasng/design-system/search-list';
import { Row, Table, TableColumn } from '@atlasng/design-system/table';
import {
  LinkCellDefinition,
  NumberCellDefinition,
  TextCellDefinition,
  TextHeaderCellDefinition,
} from '@atlasng/design-system/table/columns';
import { YouTubePlayer } from '@atlasng/design-system/youtube-player';

/** Row displayed in the showcase table. */
interface Organ extends Row {
  /** Organ name. */
  name: string;
  /** Number of datasets. */
  datasets: number;
  /** Link to the organ page. */
  link: string;
}

/** Rows displayed in the showcase table. */
const ORGANS: Organ[] = [
  { name: 'Kidney', datasets: 42, link: '/organs/kidney' },
  { name: 'Heart', datasets: 17, link: '/organs/heart' },
  { name: 'Lung', datasets: 23, link: '/organs/lung' },
];

/** Columns of the showcase table. */
const COLUMNS: TableColumn<Organ>[] = [
  {
    name: 'Organ',
    prop: 'name',
    cellTemplate: TextCellDefinition,
    headerTemplate: TextHeaderCellDefinition,
  },
  {
    name: 'Datasets',
    prop: 'datasets',
    cellTemplate: NumberCellDefinition,
    headerTemplate: TextHeaderCellDefinition,
    headerConfig: { align: 'end' },
  },
  {
    name: 'Page',
    prop: 'link',
    cellTemplate: LinkCellDefinition,
    cellConfig: { labelProp: 'name' },
    headerTemplate: TextHeaderCellDefinition,
  },
];

/**
 * Showcase page for `@atlasng/design-system` components.
 */
@Component({
  selector: 'ang-design-system-page',
  imports: [
    Breadcrumbs,
    CookieBanner,
    CookieBannerAction,
    CookieBannerDescription,
    CookieBannerPrivacyPolicy,
    CookieBannerTitle,
    Footer,
    Heading,
    MatButton,
    MatIcon,
    Notice,
    ScrollArea,
    SearchField,
    SearchList,
    Skeleton,
    Table,
    TextLink,
    YouTubePlayer,
  ],
  template: `
    <ang-breadcrumbs [items]="breadcrumbs" />
    <ang-heading level="1" tagline="Showcase">Design system</ang-heading>

    <ang-notice variant="warning" tagline="Notice">
      Read the <a angTextLink href="https://github.com/cns-iu/AtlasNG">AtlasNG repository</a> for details.
    </ang-notice>

    <h2>Icons</h2>
    <mat-icon fontIcon="home" />
    <mat-icon svgIcon="ang:star" aria-label="Star" />

    <h2>Skeleton</h2>
    <ang-skeleton lines="2" />

    <h2>Search</h2>
    <ang-search-field label="Search organs" [items]="organNames" />
    <ang-search-list aria-label="Organs" [options]="organOptions" />

    <h2>Table</h2>
    <ang-table aria-label="Organs" [rows]="organs" [columns]="columns" />

    <h2>Scroll area</h2>
    <ang-scroll-area style="display: block; height: 8rem">
      @for (paragraph of paragraphs; track $index) {
        <p>{{ paragraph }}</p>
      }
    </ang-scroll-area>

    <h2>YouTube player</h2>
    <ang-youtube-player videoId="pzUFmDhQEO8" />

    <ang-cookie-banner>
      <ang-cookie-banner-title>Cookies</ang-cookie-banner-title>
      <ang-cookie-banner-description>This showcase does not store cookies.</ang-cookie-banner-description>
      <a angTextLink angCookieBannerPrivacyPolicy href="https://example.com/privacy">Privacy policy</a>
      <button matButton="filled" angCookieBannerAction>Got it</button>
    </ang-cookie-banner>

    <ang-footer logoSrc="logo.svg" organization="AtlasNG" [socials]="socials" />
  `,
})
export class DesignSystemPage {
  /** Breadcrumb trail. */
  protected readonly breadcrumbs: BreadcrumbItem[] = [{ name: 'Home', command: '/' }, { name: 'Design system' }];

  /** Table rows. */
  protected readonly organs = ORGANS;

  /** Table columns. */
  protected readonly columns = COLUMNS;

  /** Search field items. */
  protected readonly organNames = ORGANS.map((organ) => organ.name);

  /** Search list options. */
  protected readonly organOptions: SearchListOption[] = ORGANS.map((organ) => ({
    label: organ.name,
    count: organ.datasets,
  }));

  /** Scroll area content. */
  protected readonly paragraphs = Array.from({ length: 6 }, (_, index) => `Scrollable paragraph ${index + 1}.`);

  /** Footer social media buttons. */
  protected readonly socials = ['github', 'youtube'];
}
