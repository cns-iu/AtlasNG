import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector:
    // eslint-disable-next-line @angular-eslint/component-selector
    `h1[ang-section-link], h2[ang-section-link], h3[ang-section-link],
    h4[ang-section-link], h5[ang-section-link], h6[ang-section-link]`,
  imports: [MatDividerModule, MatIconModule, MatButtonModule],
  templateUrl: './section-link.html',
  styleUrl: './section-link.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionLink {
  /** Anchor for href */
  readonly anchor = input<string>();

  /** Whether to display the underline */
  readonly underlined = input(false, { transform: booleanAttribute });
}
