import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuPanel } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TrackClick } from '@atlasng/analytics';
import { AnyLink, AnyLinkCommand } from '@atlasng/common';

/**
 * Display a help icon button that either opens a menu or a link in a new tab.
 */
@Component({
  selector: 'ang-help-button',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, TrackClick, AnyLink],
  templateUrl: './help-button.html',
  host: {
    class: 'ang-help-button',
    '[attr.aria-label]': 'null',
    '[attr.aria-describedby]': 'null',
  },
})
export class HelpButton {
  /** Optional menu attached to the help button trigger. */
  readonly menu = input<MatMenuPanel<unknown>>();

  /** Optional destination used when the help button acts as a link. */
  readonly link = input<AnyLinkCommand>();

  /** Tooltip shown when hovering or focusing the button. */
  readonly tooltip = input('Help & documentation');

  /**
   * Accessible name of the button. Defaults to "Open help menu" with a `menu`
   * and "Open help page in a new tab" otherwise.
   */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  /** Space-separated ids of elements describing the button. */
  readonly ariaDescribedby = input<string | null>(null, { alias: 'aria-describedby' });
}
