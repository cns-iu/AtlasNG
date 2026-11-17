import { Route } from '@angular/router';

/** A showcase page that renders a representative set of library components. */
export interface ShowcasePage extends Route {
  /** Route path of the page. */
  path: string;
  /** Page title shown in the navigation and the document title. */
  title: string;
}

/** Showcase pages, one per library, that are prerendered and checked by the SSR smoke test. */
export const SHOWCASE_PAGES: ShowcasePage[] = [
  {
    path: 'design-system',
    title: 'Design system',
    loadComponent: () => import('./showcase/design-system-page').then((m) => m.DesignSystemPage),
  },
  {
    path: 'labs',
    title: 'Labs',
    loadComponent: () => import('./showcase/labs-page').then((m) => m.LabsPage),
  },
  {
    path: 'common',
    title: 'Common',
    loadComponent: () => import('./showcase/common-page').then((m) => m.CommonPage),
  },
  {
    path: 'cdk',
    title: 'CDK',
    loadComponent: () => import('./showcase/cdk-page').then((m) => m.CdkPage),
  },
  {
    path: 'content-blocks',
    title: 'Content blocks',
    loadChildren: () => import('./showcase/content-blocks-page').then((m) => m.CONTENT_BLOCKS_ROUTES),
  },
];

/** Application routes. */
export const appRoutes: Route[] = [
  { path: '', title: 'AtlasNG', loadComponent: () => import('./showcase/home-page').then((m) => m.HomePage) },
  ...SHOWCASE_PAGES,
  { path: '**', redirectTo: '' },
];
