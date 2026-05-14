import { Directive, inject } from '@angular/core';
import { StyleLoader } from '@atlasng/cdk';
import { CheckboxStylesComponent } from './checkbox-styles/checkbox-styles';

/** Directive for Checkbox */
@Directive({
  selector: '[angCheckbox]',
})
export class CheckboxDirective {
  /** Injects the style loader */
  private styleLoader = inject(StyleLoader);

  /** Registers the styles and sets class names for the checkbox */
  constructor() {
    this.styleLoader.load(CheckboxStylesComponent);
  }
}
