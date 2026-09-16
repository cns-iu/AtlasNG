import { NgTemplateOutlet } from '@angular/common';
import { Component, type EnvironmentProviders, input, type Provider, signal, type Type } from '@angular/core';
import {
  LinkHandler,
  provideLinkHandler,
  type LinkCommand,
  type PreparedLink,
  withCustomHandler,
} from '@atlasng/common';
import { CUSTOM_ELEMENT_REGISTRY } from '@atlasng/core';
import type { Table } from '@atlasng/design-system/table';
import { render, screen, type ComponentInput, type RenderComponentOptions } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import type { CellContext, HeaderCellContext, Row } from '@swimlane/ngx-datatable';
import { CheckboxCellDefinition } from './checkbox/checkbox-cell';
import { CheckboxHeaderCellDefinition } from './checkbox/checkbox-header-cell';
import { CodeCellDefinition } from './code/code-cell';
import { LinkCellDefinition, type LinkCellConfig } from './link/link-cell';
import { NumberCellDefinition } from './number/number-cell';
import { TextCellDefinition } from './text/text-cell';
import { TextHeaderCellDefinition, type TextHeaderCellConfig } from './text/text-header-cell';
import { TABLE, TABLE_TEMPLATE_DEFINITION_CONFIG } from '../../../src/lib/definitions/template-definition';

interface TestRow extends Row {
  name: string;
  url: string;
}

type CellDefinitionKind = 'checkbox' | 'code' | 'link' | 'number' | 'text';
type HeaderDefinitionKind = 'checkbox' | 'text';

class MockLinkHandler implements LinkHandler {
  readonly prepareLink = vi.fn((command: LinkCommand): PreparedLink => ({ href: String(command.command) }));
  readonly navigateTo = vi.fn((): boolean => false);
  readonly isActive = vi.fn(() => signal(false));
}

@Component({
  imports: [
    CheckboxCellDefinition,
    CodeCellDefinition,
    LinkCellDefinition,
    NgTemplateOutlet,
    NumberCellDefinition,
    TextCellDefinition,
  ],
  template: `
    @switch (definition()) {
      @case ('checkbox') {
        <ang-table-checkbox-cell-definition #templateDefinition />
        <ng-container [ngTemplateOutlet]="templateDefinition.template()" [ngTemplateOutletContext]="context()" />
      }
      @case ('code') {
        <ang-table-code-cell-definition #templateDefinition />
        <ng-container [ngTemplateOutlet]="templateDefinition.template()" [ngTemplateOutletContext]="context()" />
      }
      @case ('link') {
        <ang-table-link-cell-definition #templateDefinition />
        <ng-container [ngTemplateOutlet]="templateDefinition.template()" [ngTemplateOutletContext]="context()" />
      }
      @case ('number') {
        <ang-table-number-cell-definition #templateDefinition />
        <ng-container [ngTemplateOutlet]="templateDefinition.template()" [ngTemplateOutletContext]="context()" />
      }
      @case ('text') {
        <ang-table-text-cell-definition #templateDefinition />
        <ng-container [ngTemplateOutlet]="templateDefinition.template()" [ngTemplateOutletContext]="context()" />
      }
    }
  `,
})
class CellDefinitionHost {
  readonly definition = input.required<CellDefinitionKind>();
  readonly context = input.required<CellContext>();
}

@Component({
  imports: [CheckboxHeaderCellDefinition, NgTemplateOutlet, TextHeaderCellDefinition],
  template: `
    @switch (definition()) {
      @case ('checkbox') {
        <ang-table-checkbox-header-cell-definition #templateDefinition />
        @if (renderTemplate()) {
          <ng-container [ngTemplateOutlet]="templateDefinition.template()" [ngTemplateOutletContext]="context()" />
        }
      }
      @case ('text') {
        <ang-table-text-header-cell-definition #templateDefinition />
        @if (renderTemplate()) {
          <ng-container [ngTemplateOutlet]="templateDefinition.template()" [ngTemplateOutletContext]="context()" />
        }
      }
    }
  `,
})
class HeaderCellDefinitionHost {
  readonly definition = input.required<HeaderDefinitionKind>();
  readonly context = input.required<HeaderCellContext>();
  readonly renderTemplate = input(false);
}

const ROW: TestRow = { name: 'Ada', url: '/ada' };

function cellContext(overrides: Partial<CellContext<TestRow>> = {}): CellContext<TestRow> {
  return { row: ROW, value: ROW.name, ...overrides } as CellContext<TestRow>;
}

function headerContext(overrides: Partial<HeaderCellContext> = {}): HeaderCellContext {
  return {
    column: { name: 'Name', sortable: true },
    sortDir: undefined,
    sortFn: vi.fn(),
    selectFn: vi.fn(),
    ...overrides,
  } as HeaderCellContext;
}

describe('column template definitions', () => {
  async function setup<T>(
    component: Type<T>,
    inputs: ComponentInput<T>,
    config?: unknown,
    table: unknown = {} as Table,
    options: RenderComponentOptions<T> = {},
  ) {
    const user = userEvent.setup();
    const result = await render(component, {
      ...options,
      inputs,
      providers: [
        { provide: TABLE, useValue: table },
        { provide: TABLE_TEMPLATE_DEFINITION_CONFIG, useValue: config },
        ...(options.providers ?? []),
      ],
    });
    return { ...result, user };
  }

  function setupCell(
    definition: CellDefinitionKind,
    context: CellContext,
    config?: unknown,
    options?: RenderComponentOptions<CellDefinitionHost>,
  ) {
    return setup(CellDefinitionHost, { definition, context }, config, undefined, options);
  }

  async function setupHeader(
    definition: HeaderDefinitionKind,
    context: HeaderCellContext,
    config?: unknown,
    table?: unknown,
  ) {
    const result = await setup(HeaderCellDefinitionHost, { definition, context }, config, table);
    await result.rerender({ inputs: { renderTemplate: true }, partialUpdate: true });
    return result;
  }

  describe('CheckboxCellDefinition', () => {
    it('reflects checked and disabled context state', async () => {
      await setupCell('checkbox', cellContext({ disabled: true, isSelected: true, onCheckboxChangeFn: vi.fn() }));

      const checkbox = screen.getByRole('checkbox', { name: 'Select row' });
      expect(checkbox).toBeChecked();
      expect(checkbox).toBeDisabled();
    });

    it('forwards checkbox clicks to the cell selection callback', async () => {
      const onCheckboxChangeFn = vi.fn();
      const { user } = await setupCell('checkbox', cellContext({ onCheckboxChangeFn }));

      await user.click(screen.getByRole('checkbox', { name: 'Select row' }));

      expect(onCheckboxChangeFn).toHaveBeenCalledOnce();
    });
  });

  describe('CheckboxHeaderCellDefinition', () => {
    it('reflects an indeterminate selection state', async () => {
      const table = {
        rows: signal([ROW, { name: 'Grace', url: '/grace' }]),
        selected: signal([ROW]),
      } as unknown as Table<TestRow>;
      await setupHeader('checkbox', headerContext({ allRowsSelected: false }), undefined, table);

      expect(screen.getByRole('checkbox', { name: 'Select all rows' })).toBePartiallyChecked();
    });

    it('reflects a checked selection state', async () => {
      const table = { rows: signal([ROW]), selected: signal([ROW]) } as unknown as Table<TestRow>;
      await setupHeader('checkbox', headerContext({ allRowsSelected: true }), undefined, table);

      expect(screen.getByRole('checkbox', { name: 'Select all rows' })).toBeChecked();
    });

    it('forwards changes to the select-all callback', async () => {
      const selectFn = vi.fn();
      const table = { rows: signal([ROW]), selected: signal([]) } as unknown as Table<TestRow>;
      const { user } = await setupHeader('checkbox', headerContext({ selectFn }), undefined, table);

      await user.click(screen.getByRole('checkbox', { name: 'Select all rows' }));

      expect(selectFn).toHaveBeenCalledOnce();
    });
  });

  describe('CodeCellDefinition', () => {
    it('renders an intentionally empty scaffold', async () => {
      await setupCell('code', cellContext({ value: 'secret' }));

      expect(screen.queryByText('secret')).not.toBeInTheDocument();
    });
  });

  describe('LinkCellDefinition', () => {
    function linkProviders(handler: MockLinkHandler): (Provider | EnvironmentProviders)[] {
      return [
        { provide: CUSTOM_ELEMENT_REGISTRY, useValue: { get: vi.fn().mockReturnValue(undefined) } },
        provideLinkHandler(withCustomHandler(() => handler)),
      ];
    }

    it('renders a static label and forwards the cell value as a command', async () => {
      const handler = new MockLinkHandler();
      await setupCell('link', cellContext({ value: ROW.url }), { label: 'Profile' } satisfies LinkCellConfig<TestRow>, {
        providers: linkProviders(handler),
      });

      expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', ROW.url);
      expect(handler.prepareLink).toHaveBeenCalledWith(
        { command: ROW.url, preserveFragment: false },
        expect.any(HTMLAnchorElement),
        expect.anything(),
        expect.anything(),
      );
    });

    it('derives a label from a row property', async () => {
      const handler = new MockLinkHandler();
      await setupCell(
        'link',
        cellContext({ value: ROW.url }),
        { labelProp: 'name' } satisfies LinkCellConfig<TestRow>,
        {
          providers: linkProviders(handler),
        },
      );

      expect(screen.getByRole('link', { name: 'Ada' })).toBeInTheDocument();
    });

    it('derives a label with the configured row function', async () => {
      const handler = new MockLinkHandler();
      await setupCell(
        'link',
        cellContext({ value: ROW.url }),
        { labelFn: (row) => `Open ${row.name}` } satisfies LinkCellConfig<TestRow>,
        { providers: linkProviders(handler) },
      );

      expect(screen.getByRole('link', { name: 'Open Ada' })).toBeInTheDocument();
    });
  });

  describe('NumberCellDefinition', () => {
    it('renders a localized number', async () => {
      await setupCell('number', cellContext({ value: 1234.5 }));

      expect(screen.getByText('1,234.5')).toHaveClass('ang-table--number-cell');
    });
  });

  describe('TextCellDefinition', () => {
    it('renders the supplied cell value', async () => {
      await setupCell('text', cellContext({ value: 'Ada' }));

      expect(screen.getByText('Ada')).toHaveClass('ang-table--text-cell');
    });
  });

  describe('TextHeaderCellDefinition', () => {
    it('renders an aligned sortable button and invokes the sort callback', async () => {
      const sortFn = vi.fn();
      const { user } = await setupHeader('text', headerContext({ sortFn }), {
        align: 'end',
      } satisfies TextHeaderCellConfig);
      const button = screen.getByRole('button', { name: 'Name' });

      expect(button).toHaveClass('ang-table--text-header-align-end');
      expect(button.querySelector('mat-icon')).toHaveAttribute('fonticon', 'arrow_upward_alt');
      await user.click(button);
      expect(sortFn).toHaveBeenCalledOnce();
    });

    it('renders a non-interactive header for a static column', async () => {
      await setupHeader('text', headerContext({ column: { name: 'Static', sortable: false } }), {
        align: 'center',
      } satisfies TextHeaderCellConfig);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.getByText('Static').parentElement).toHaveClass('ang-table--text-header-align-center');
    });
  });
});
