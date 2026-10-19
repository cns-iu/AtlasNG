import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import { Component, input, type EnvironmentProviders, type Provider, type Type } from '@angular/core';
import type { CellContext, HeaderCellContext, Row, TableTemplateDefinition } from '@atlasng/design-system/table';
import { render } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { TABLE, TABLE_TEMPLATE_DEFINITION_CONFIG } from '../../../../src/lib/definitions/template-definition';

/** Row shape shared by column definition specs. */
export interface TestRow extends Row {
  name: string;
  url: string;
}

/** Row rendered by column definition specs. */
export const ROW: TestRow = { name: 'Ada', url: '/ada' };

/**
 * Creates a body-cell context for {@link ROW}.
 *
 * @param overrides Context fields replacing the defaults.
 * @returns Body-cell context.
 */
export function cellContext(overrides: Partial<CellContext<TestRow>> = {}): CellContext {
  return { row: ROW, value: ROW.name, ...overrides } as CellContext;
}

/**
 * Creates a sortable header-cell context with no-op callbacks.
 *
 * @param overrides Context fields replacing the defaults.
 * @returns Header-cell context.
 */
export function headerContext(overrides: Partial<HeaderCellContext> = {}): HeaderCellContext {
  return {
    column: { name: 'Name', sortable: true },
    sortDir: undefined,
    sortFn: () => undefined,
    selectFn: () => undefined,
    ...overrides,
  } as HeaderCellContext;
}

/**
 * Creates a template definition and renders its template with a supplied context.
 */
@Component({
  imports: [NgComponentOutlet, NgTemplateOutlet],
  template: `
    <ng-container [ngComponentOutlet]="definition()" #outlet="ngComponentOutlet" />
    @if (renderTemplate()) {
      <ng-container [ngTemplateOutlet]="outlet.componentInstance?.template()" [ngTemplateOutletContext]="context()" />
    }
  `,
})
class DefinitionHost {
  /** Definition component type to create. */
  readonly definition = input.required<Type<TableTemplateDefinition<unknown, unknown>>>();

  /** Context passed to the definition's template. */
  readonly context = input.required<unknown>();

  /** Renders the template once the definition's view queries have resolved. */
  readonly renderTemplate = input(false);
}

/** Options for {@link renderDefinition}. */
export interface RenderDefinitionOptions {
  /** Configuration injected into the definition. */
  config?: unknown;
  /** Table injected into the definition. */
  table?: unknown;
  /** Additional providers, such as link handlers. */
  providers?: (Provider | EnvironmentProviders)[];
}

/**
 * Renders a table template definition with the supplied context, configuration, and table.
 *
 * @param definition Definition component type to render.
 * @param context Context passed to the definition's template.
 * @param options Configuration, table, and providers for the definition.
 * @returns Testing Library render result with a `user-event` instance.
 */
export async function renderDefinition<TContext>(
  definition: Type<TableTemplateDefinition<TContext, unknown>>,
  context: TContext,
  { config, table = {}, providers = [] }: RenderDefinitionOptions = {},
) {
  const user = userEvent.setup();
  const result = await render(DefinitionHost, {
    inputs: { definition: definition as Type<TableTemplateDefinition<unknown, unknown>>, context },
    providers: [
      { provide: TABLE, useValue: table },
      { provide: TABLE_TEMPLATE_DEFINITION_CONFIG, useValue: config },
      ...providers,
    ],
  });
  await result.rerender({ inputs: { renderTemplate: true }, partialUpdate: true });

  return { ...result, user };
}
