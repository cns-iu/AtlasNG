import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuPanel } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TrackClick } from '@atlasng/analytics';

@Component({
  selector: 'ang-help-button',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, TrackClick],
  templateUrl: './help-button.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpButton {
  readonly menu = input<MatMenuPanel<unknown>>();
  readonly link = input<string>();
}
