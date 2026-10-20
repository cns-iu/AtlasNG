import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Marks an `ng-template` rendered after the explorer table and its
 * end-of-results indicator, such as a footer. It scrolls with the table.
 */
@Directive({
  selector: 'ng-template[angKgExplorerTableEnd]',
})
export class KgExplorerTableEndSlot {
  /** Template rendered at the end of the table. */
  readonly template = inject(TemplateRef);
}
