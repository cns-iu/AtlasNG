import { NgTemplateOutlet } from '@angular/common';
import { Component, input, type Type, viewChild } from '@angular/core';
import { render, screen, type ComponentInput, type RenderComponentOptions } from '@testing-library/angular';
import type { CellContext, HeaderCellContext, Row } from '@swimlane/ngx-datatable';
import { expectTypeOf } from 'vitest';
import type { Table } from '../table';
import { CellTemplateContext, HeaderCellTemplateContext } from './template-context';
import { CellDefinition, HeaderCellDefinition, TABLE, TABLE_TEMPLATE_DEFINITION_CONFIG } from './template-definition';

interface TestRow extends Row {
  name: string;
}

interface TestConfig {
  prefix: string;
}

@Component({
  selector: 'ang-test-cell-definition',
  imports: [CellTemplateContext],
  template: `
    <ng-template let-row="row" [angCellTemplateContext]="rowType">{{ config.prefix }}{{ row.name }}</ng-template>
  `,
})
class TestCellDefinition extends CellDefinition<TestRow, TestConfig> {
  readonly inferredRow = this.rowType;
}

@Component({
  selector: 'ang-test-header-cell-definition',
  imports: [HeaderCellTemplateContext],
  template: `
    <ng-template let-column="column" angHeaderCellTemplateContext>{{ config.prefix }}{{ column.name }}</ng-template>
  `,
})
class TestHeaderCellDefinition extends HeaderCellDefinition<TestConfig> {}

@Component({
  imports: [NgTemplateOutlet, TestCellDefinition],
  template: `
    <ang-test-cell-definition #definition />
    <ng-container [ngTemplateOutlet]="definition.template()" [ngTemplateOutletContext]="context()" />
  `,
})
class TestCellDefinitionHost {
  readonly context = input.required<CellContext<TestRow>>();
  readonly definition = viewChild.required(TestCellDefinition);
}

@Component({
  imports: [NgTemplateOutlet, TestHeaderCellDefinition],
  template: `
    <ang-test-header-cell-definition #definition />
    <ng-container [ngTemplateOutlet]="definition.template()" [ngTemplateOutletContext]="context()" />
  `,
})
class TestHeaderCellDefinitionHost {
  readonly context = input.required<HeaderCellContext>();
  readonly definition = viewChild.required(TestHeaderCellDefinition);
}

function cellContext(row: TestRow): CellContext<TestRow> {
  return { row } as CellContext<TestRow>;
}

function headerContext(name: string): HeaderCellContext {
  return { column: { name } } as HeaderCellContext;
}

describe('template definitions', () => {
  const table = {} as Table;
  const config: TestConfig = { prefix: 'Rendered: ' };

  async function setup<T>(component: Type<T>, inputs: ComponentInput<T>, options: RenderComponentOptions<T> = {}) {
    return render(component, {
      ...options,
      inputs,
      providers: [
        { provide: TABLE, useValue: table },
        { provide: TABLE_TEMPLATE_DEFINITION_CONFIG, useValue: config },
        ...(options.providers ?? []),
      ],
    });
  }

  it('injects the owning table and configuration into a body-cell definition', async () => {
    const { fixture } = await setup(TestCellDefinitionHost, { context: cellContext({ name: 'Ada' }) });
    const definition = fixture.componentInstance.definition();

    expect(definition.table).toBe(table);
    expect(definition.config).toBe(config);
  });

  it('resolves and renders the body-cell context template', async () => {
    await setup(TestCellDefinitionHost, { context: cellContext({ name: 'Ada' }) });

    expect(screen.getByText('Rendered: Ada')).toBeInTheDocument();
  });

  it('preserves the generic row type through the body-cell row bridge', async () => {
    const { fixture } = await setup(TestCellDefinitionHost, { context: cellContext({ name: 'Ada' }) });

    expectTypeOf(fixture.componentInstance.definition().inferredRow).toEqualTypeOf<TestRow>();
  });

  it('injects configuration and renders the header-cell context template', async () => {
    const { fixture } = await setup(TestHeaderCellDefinitionHost, { context: headerContext('Name') });
    const definition = fixture.componentInstance.definition();

    expect(definition.table).toBe(table);
    expect(definition.config).toBe(config);
    expect(screen.getByText('Rendered: Name')).toBeInTheDocument();
  });
});
