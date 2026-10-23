import { Directive, inject } from '@angular/core';
import { RichTooltip } from './rich-tooltip';

/**
 * Closes the enclosing {@link RichTooltip} when the host element is clicked.
 * Must be placed inside the content of an `<ang-rich-tooltip>`.
 */
@Directive({
  selector: '[angRichTooltipClose]',
  host: {
    '(click)': 'tooltip.close()',
  },
})
export class RichTooltipClose {
  /** The rich tooltip panel that contains this element. */
  protected readonly tooltip = inject(RichTooltip);
}
