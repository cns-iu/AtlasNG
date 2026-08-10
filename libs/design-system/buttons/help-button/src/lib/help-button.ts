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
  host: { class: 'ang-help-button' },
})
export class HelpButton {
  /** Optional menu attached to the help button trigger. */
  readonly menu = input<MatMenuPanel<unknown>>();

  /** Optional destination used when the help button acts as a link. */
  readonly link = input<AnyLinkCommand>();
}
