import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { AnyLink } from '@atlasng/common';

@Component({
  selector:
    // eslint-disable-next-line @angular-eslint/component-selector
    `h1[angSectionHeader], h2[angSectionHeader], h3[angSectionHeader],
    h4[angSectionHeader], h5[angSectionHeader], h6[angSectionHeader]`,
  imports: [MatDividerModule, MatIconModule, MatButtonModule, AnyLink],
  templateUrl: './section-header.html',
  styleUrl: './section-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHeader {
  /** Unique ID for the section header */
  readonly id = input<string>();

  /** Whether to display the underline */
  readonly underlined = input(true, { transform: booleanAttribute });
}
