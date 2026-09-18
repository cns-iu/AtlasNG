import { Directive, inject, input, TemplateRef } from '@angular/core';
import type { CellContext, HeaderCellContext, Row } from '@swimlane/ngx-datatable';

/**
 * Narrows an annotated template to the body-cell context provided by ngx-datatable.
 */
@Directive({
  selector: 'ng-template[angCellTemplateContext]',
})
export class CellTemplateContext<TRow extends Row = Row> {
  /** Type-only row value used to infer the template's generic row context. */
  readonly rowType = input.required<TRow>({ alias: 'angCellTemplateContext' });

  /** Template whose embedded views receive {@link CellContext}. */
  readonly template = inject<TemplateRef<CellContext<TRow>>>(TemplateRef);

  /**
   * Narrows the template context for Angular's template type checker.
   *
   * @param _definition Directive instance associated with the template.
   * @param _context Context supplied when the template is instantiated.
   * @returns True because this guard exists only to communicate the context type.
   */
  static ngTemplateContextGuard<TRow extends Row = Row>(
    _definition: CellTemplateContext<TRow>,
    _context: unknown,
  ): _context is CellContext<TRow> {
    return true;
  }
}

/** Narrows an annotated template to the header-cell context provided by ngx-datatable. */
@Directive({
  selector: 'ng-template[angHeaderCellTemplateContext]',
})
export class HeaderCellTemplateContext {
  /** Template whose embedded views receive {@link HeaderCellContext}. */
  readonly template = inject<TemplateRef<HeaderCellContext>>(TemplateRef);

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
