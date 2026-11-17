import { Component } from '@angular/core';

/**
 * Landing page of the showcase application.
 */
@Component({
  selector: 'ang-home-page',
  template: `
    <h1>AtlasNG</h1>
    <p>
      Each page renders a representative set of AtlasNG library components. Every page is prerendered at build time and
      hydrated in the browser, and the SSR smoke check fails when rendering or hydration reports an error.
    </p>
  `,
})
export class HomePage {}
