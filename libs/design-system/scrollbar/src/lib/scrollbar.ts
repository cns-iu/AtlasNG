import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  NgScrollbar,
  type ScrollbarOrientation,
  type ScrollbarPosition,
  type ScrollbarVisibility,
} from 'ngx-scrollbar';

export type { ScrollbarOrientation, ScrollbarPosition, ScrollbarVisibility };

/**
 * Scroll container that replaces native scrollbars with a thin overlay scrollbar.
 *
 * Built on `ngx-scrollbar`. By default the scrollbar is hidden and fades in while the
 * container is hovered, focused, or scrolled, and it overlays the content instead of
 * reserving space for itself. Constrain the size of the host (for example with `height`
 * or `max-height`) so that its projected content can overflow and scroll.
 */
@Component({
  selector: 'ang-scrollbar',
  imports: [NgScrollbar],
  templateUrl: './scrollbar.html',
  styleUrl: './scrollbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ang-scrollbar',
  },
})
export class Scrollbar {
  /** Directions the content can scroll in. `auto` shows a scrollbar for every overflowing direction. */
  readonly orientation = input<ScrollbarOrientation>('auto');

  /** When the scrollbar is shown. `hover` shows it only while the container is hovered or scrolled. */
  readonly visibility = input<ScrollbarVisibility>('hover');

  /** Side of the container each scrollbar is placed on. `native` follows the browser's default placement. */
  readonly position = input<ScrollbarPosition>('native');
}
