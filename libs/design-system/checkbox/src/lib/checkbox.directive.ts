import { Directive, inject } from '@angular/core';
import { StyleLoader } from 'libs/cdk/src/lib/style-loader';
import { CheckboxStylesComponent } from './checkbox-styles/checkbox-styles';

/** Type of Checkbox size */
export type CheckboxSize = 'small' | 'medium';

/** Directive for Checkbox */
@Directive({
  selector: 'mat-checkbox',
})
export class CheckboxDirective {
  private styleLoader = inject(StyleLoader);

  /** Registers the styles and sets class names for the checkbox */
  constructor() {
    this.styleLoader.load(CheckboxStylesComponent);
  }
}
