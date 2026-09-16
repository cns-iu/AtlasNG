import type { CellContext, HeaderCellContext, Row } from '@swimlane/ngx-datatable';
import { expectTypeOf } from 'vitest';
import { CellTemplateContext, HeaderCellTemplateContext } from './template-context';

interface TestRow extends Row {
  name: string;
}

describe('CellTemplateContext', () => {
  it('narrows an unknown value to CellContext', () => {
    const definition = null as unknown as CellTemplateContext<TestRow>;
    const context: unknown = {};

    if (CellTemplateContext.ngTemplateContextGuard(definition, context)) {
      const typedContext: CellContext<TestRow> = context;

      expectTypeOf(typedContext.row).toEqualTypeOf<TestRow>();
    }
  });
});

describe('HeaderCellTemplateContext', () => {
  it('narrows an unknown value to HeaderCellContext', () => {
    const definition = null as unknown as HeaderCellTemplateContext;
    const context: unknown = {};

    if (HeaderCellTemplateContext.ngTemplateContextGuard(definition, context)) {
      const typedContext: HeaderCellContext = context;

      expectTypeOf(typedContext.column).toEqualTypeOf<HeaderCellContext['column']>();
    }
  });
});
