import { signal } from '@angular/core';
import { RESIZE_OBSERVER } from '@atlasng/core';
import { DatatableComponent, type TableColumn } from '@swimlane/ngx-datatable';
import { render } from '@testing-library/angular';
import { TableColumnLayout } from './column-layout';

interface TestRow {
  name: string;
  score: number;
  code: string;
}

const ROWS: TestRow[] = [{ name: 'Ada', score: 1, code: 'ada' }];

describe('TableColumnLayout', () => {
  async function setup(
    columns: (TableColumn<TestRow> & { fitContent?: boolean })[],
    resizeObserver: unknown = undefined,
  ) {
    let callback: ResizeObserverCallback | undefined;
    const observer = { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() };
    class ResizeObserverMock {
      constructor(cb: ResizeObserverCallback) {
        callback = cb;
        // eslint-disable-next-line no-constructor-return
        return observer;
      }
    }
    const columnState = signal(columns);
    const rowState = signal(ROWS);
    const result = await render('<ngx-datatable angTableColumnLayout [rows]="rows()" [columns]="columns()" />', {
      imports: [DatatableComponent, TableColumnLayout],
      componentProperties: { columns: columnState, rows: rowState },
      providers: [
        { provide: RESIZE_OBSERVER, useValue: resizeObserver === undefined ? ResizeObserverMock : resizeObserver },
      ],
    });
    const datatable = result.fixture.nativeElement.querySelector('ngx-datatable') as HTMLElement;

    return {
      ...result,
      columns: columnState,
      rows: rowState,
      observer,
      grid: datatable.querySelector('.datatable-grid') as HTMLElement,
      tracks: () => datatable.style.getPropertyValue('--ang-table-column-tracks'),
      resize(inlineSize: number): void {
        callback?.(
          [{ contentBoxSize: [{ inlineSize }] } as unknown as ResizeObserverEntry],
          observer as unknown as ResizeObserver,
        );
      },
    };
  }

  it('lays out the columns for the measured grid width, honoring maxWidth', async () => {
    const { grid, observer, resize, tracks } = await setup([
      { name: 'Name', prop: 'name', minWidth: 100, maxWidth: 150, flexGrow: 1 },
      { name: 'Score', prop: 'score', flexGrow: 1 },
    ]);

    expect(observer.observe).toHaveBeenCalledWith(grid);
    expect(tracks()).toBe('');

    resize(400);
    expect(tracks()).toBe('150px minmax(0, 1fr)');
  });

  it('lays out changed columns in the order ngx-datatable renders them', async () => {
    const { columns, fixture, resize, tracks } = await setup([{ name: 'Name', prop: 'name', flexGrow: 1 }]);
    resize(400);

    columns.set([
      { name: 'Name', prop: 'name', width: 50 },
      { name: 'Score', prop: 'score', width: 60, frozenRight: true },
      { name: 'Code', prop: 'code', width: 70, frozenLeft: true },
    ]);
    fixture.detectChanges();

    expect(tracks()).toBe('70px 50px 60px');
  });

  it('measures columns that fit their content again when the rows change', async () => {
    const { fixture, grid, resize, rows, tracks } = await setup([
      { name: 'Name', prop: 'name', fitContent: true, maxWidth: 200 },
      { name: 'Score', prop: 'score', flexGrow: 1 },
    ]);
    const measured: string[] = [];
    const getComputedStyle = window.getComputedStyle.bind(window);
    const spy = vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => {
      if (element !== grid) {
        return getComputedStyle(element);
      }
      measured.push(tracks());
      return { gridTemplateColumns: `${100 + measured.length * 20}px 0px` } as CSSStyleDeclaration;
    });

    resize(400);
    expect(tracks()).toBe('120px minmax(0, 1fr)');

    rows.set([...ROWS, { name: 'Grace', score: 2, code: 'grace' }]);
    fixture.detectChanges();
    spy.mockRestore();

    expect(measured).toEqual(['max-content 0px', 'max-content 0px']);
    expect(tracks()).toBe('140px minmax(0, 1fr)');
  });

  it("keeps ngx-datatable's layout without a ResizeObserver", async () => {
    const { tracks } = await setup([{ name: 'Name', prop: 'name' }], null);

    expect(tracks()).toBe('');
  });
});
