import { CdkMonitorFocus } from '@angular/cdk/a11y';
import { Component, ViewEncapsulation } from '@angular/core';
import { MatRipple } from '@angular/material/core';
import { MatIcon } from '@angular/material/icon';
import { HeaderCellDefinition, HeaderCellTemplateContext } from '@atlasng/design-system/table';

/** Logical alignments supported by the standard text header. */
export type TextHeaderAlignment = 'start' | 'center' | 'end';

/** Configuration for the standard text header definition. */
export interface TextHeaderCellConfig {
  /** Logical alignment of the label and sort indicator. */
  align?: TextHeaderAlignment;
}

/** Reusable text header with optional sorting and logical alignment. */
@Component({
  selector: 'ang-table-text-header-cell-definition',
  imports: [CdkMonitorFocus, HeaderCellTemplateContext, MatIcon, MatRipple],
  templateUrl: './text-header-cell.html',
  styleUrl: './text-header-cell.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TextHeaderCellDefinition extends HeaderCellDefinition<TextHeaderCellConfig> {}
