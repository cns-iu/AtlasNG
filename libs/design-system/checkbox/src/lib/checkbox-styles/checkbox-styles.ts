import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * Applies checkbox styles globally
 */
@Component({
  selector: 'ang-checkbox-styles',
  template: '',
  styleUrl: './checkbox-styles.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class CheckboxStylesComponent {}
