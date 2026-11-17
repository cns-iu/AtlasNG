import { Component } from '@angular/core';
import { AnyLink, AnyLinkActive, LinkHandler, RouterLinkHandler } from '@atlasng/common';

/** Links rendered with both link handlers. */
const LINKS_TEMPLATE = `
  <ul angAnyLinkActive="ang-link-list--active" ariaCurrentWhenActive="page">
    <li><a angAnyLink="/common">This page</a></li>
    <li><a angAnyLink="/cdk" [queryParams]="{ tab: 'search' }" fragment="highlight">CDK page</a></li>
    <li><a angAnyLink="https://github.com/cns-iu/AtlasNG" target="_blank">GitHub</a></li>
    <li><span angAnyLink="/labs">Labs (non-anchor host)</span></li>
  </ul>
`;

/**
 * Links resolved by the default routerless link handler.
 */
@Component({
  selector: 'ang-routerless-links',
  imports: [AnyLink, AnyLinkActive],
  template: LINKS_TEMPLATE,
})
export class RouterlessLinks {}

/**
 * Links resolved by the router link handler.
 */
@Component({
  selector: 'ang-router-links',
  imports: [AnyLink, AnyLinkActive],
  template: LINKS_TEMPLATE,
  providers: [{ provide: LinkHandler, useExisting: RouterLinkHandler }],
})
export class RouterLinks {}

/**
 * Showcase page for `@atlasng/common` link handling.
 */
@Component({
  selector: 'ang-common-page',
  imports: [RouterLinks, RouterlessLinks],
  template: `
    <h1>Common</h1>
    <h2>Routerless link handler</h2>
    <ang-routerless-links />
    <h2>Router link handler</h2>
    <ang-router-links />
  `,
})
export class CommonPage {}
