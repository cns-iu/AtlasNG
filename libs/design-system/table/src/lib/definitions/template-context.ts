import { Directive } from '@angular/core';
import type { CellContext, HeaderCellContext } from '@swimlane/ngx-datatable';

/** Narrows an annotated template to the body-cell context provided by ngx-datatable. */
@Directive({
  selector: 'ng-template[angCellTemplateContext]',
})
export class CellTemplateContext {
  /**
   * Narrows the template context for Angular's template type checker.
   *
   * @param _definition Directive instance associated with the template.
   * @param _context Context supplied when the template is instantiated.
   * @returns True because this guard exists only to communicate the context type.
   */
  static ngTemplateContextGuard(_definition: CellTemplateContext, _context: unknown): _context is CellContext {
    return true;
  }
}

/** Narrows an annotated template to the header-cell context provided by ngx-datatable. */
@Directive({
  selector: 'ng-template[angHeaderCellTemplateContext]',
})
export class HeaderCellTemplateContext {
  /**
   * Narrows the template context for Angular's template type checker.
   *
   * @param _definition Directive instance associated with the template.
   * @param _context Context supplied when the template is instantiated.
   * @returns True because this guard exists only to communicate the context type.
   */
  static ngTemplateContextGuard(
    _definition: HeaderCellTemplateContext,
    _context: unknown,
  ): _context is HeaderCellContext {
    return true;
  }
}
