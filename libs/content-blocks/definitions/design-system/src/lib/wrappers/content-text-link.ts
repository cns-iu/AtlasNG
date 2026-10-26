import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TextLink } from '@atlasng/design-system/links/text-link';

/**
 * Renders a design-system `TextLink` for a `TextLink` node. `TextLink` is selected by `a[angTextLink]` and takes its
 * URL as an `href` attribute, which a definition cannot set, so this wrapper binds it; the binding is sanitized by
 * Angular, so a document cannot inject a `javascript:` URL.
 */
@Component({
  selector: 'ang-content-text-link',
  imports: [TextLink],
  template: '<a angTextLink [href]="href()"><ng-content /></a>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ang-content-text-link' },
})
export class ContentTextLink {
  /** Link URL. */
  readonly href = input.required<string>();
}
