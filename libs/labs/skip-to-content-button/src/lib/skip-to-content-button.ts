import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AnyLink } from '@atlasng/common';

@Component({
  selector: 'ang-skip-to-content-button',
  imports: [MatButtonModule, MatIconModule, AnyLink],
  templateUrl: './skip-to-content-button.html',
  styleUrl: './skip-to-content-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkipToContentButton {
  /** The ID of the anchor element to skip to. */
  readonly anchorId = input.required<string>();

  /** The label for the button. */
  readonly label = input('Skip to main content');
}
