import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuPanel } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TrackClick } from '@atlasng/analytics';
import { AnyLink, AnyLinkCommand } from '@atlasng/common';

@Component({
  selector: 'ang-help',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, TrackClick, AnyLink],
  templateUrl: './help.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Help button component used in the design system.
 *
 * Supports either a direct link target or an attached menu for help and
 * documentation actions.
 */
export class Help {
  /** Optional menu attached to the help button trigger. */
  readonly menu = input<MatMenuPanel<unknown>>();

  /** Optional destination used when the help button acts as a link. */
  readonly link = input<AnyLinkCommand>();
}
