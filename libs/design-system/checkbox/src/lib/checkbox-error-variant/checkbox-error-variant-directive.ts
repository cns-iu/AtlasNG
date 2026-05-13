import { Directive } from '@angular/core';

/**
 * Directive for checkbox error variant
 */
@Directive({
  selector: '[angCheckboxErrorVariant]',
  host: {
    class: 'ang-checkbox-error-variant',
  },
})
export class CheckboxErrorVariantDirective {}
