import { Component } from '@angular/core';
import { SearchHighlight, SearchRange } from '@atlasng/cdk/search';

/**
 * Showcase page for `@atlasng/cdk` search highlighting.
 */
@Component({
  selector: 'ang-cdk-page',
  imports: [SearchHighlight],
  template: `
    <h1>CDK</h1>
    <p id="highlight">
      <span [angSearchHighlight]="text" [angSearchHighlightRanges]="ranges">{{ text }}</span>
    </p>
    <p><span [angSearchHighlight]="text" [angSearchHighlightRanges]="ranges"></span></p>
  `,
})
export class CdkPage {
  /** Highlighted text. */
  protected readonly text = 'Human Reference Atlas';

  /** Highlighted ranges of the text. */
  protected readonly ranges: SearchRange[] = [[0, 5]];
}
