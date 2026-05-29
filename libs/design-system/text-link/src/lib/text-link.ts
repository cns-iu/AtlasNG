import { FocusMonitor, FocusOrigin } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, ElementRef, inject, ViewEncapsulation } from '@angular/core';
import { TrackClick } from '@atlasng/analytics';

/**
 * Styled anchor directive for AtlasNG text links.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'a[angTextLink]',
  templateUrl: './text-link.html',
  styleUrl: './text-link.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ang-text-link',
  },
  hostDirectives: [
    {
      directive: TrackClick,
      inputs: ['angTrackClick: angTrackTextLink', 'angTrackClickOptions: angTrackTextLinkOptions'],
    },
  ],
})
export class TextLink {
  /** Focus manager. */
  private readonly focusMonitor = inject(FocusMonitor);

  /** Native host anchor element. */
  private readonly element = inject(ElementRef).nativeElement as HTMLElement;

  /**
   * Moves focus to the host anchor using the Angular CDK focus monitor.
   *
   * @param origin Focus origin to apply when moving focus.
   * @param options Optional focus options passed to the underlying focus call.
   */
  focus(origin: FocusOrigin = 'program', options?: FocusOptions): void {
    if (origin) {
      this.focusMonitor.focusVia(this.element, origin, options);
    } else {
      this.element.focus(options);
    }
  }
}
