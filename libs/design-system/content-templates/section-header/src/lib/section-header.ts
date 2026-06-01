import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector:
    // eslint-disable-next-line @angular-eslint/component-selector
    `h1[ang-section-header], h2[ang-section-header], h3[ang-section-header],
    h4[ang-section-header], h5[ang-section-header], h6[ang-section-header]`,
  imports: [MatDividerModule, MatIconModule, MatButtonModule],
  templateUrl: './section-header.html',
  styleUrl: './section-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHeader {
  /** Anchor for href */
  readonly anchor = input<string>();

  /** Whether to display the underline */
  readonly underlined = input(true, { transform: booleanAttribute });
}
