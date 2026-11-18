import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { render } from '@testing-library/angular';
import { StickyHeader } from './sticky-header';

describe('StickyHeader', () => {
  let resize: () => void;
  const observe = vi.fn();
  const disconnect = vi.fn();

  beforeEach(() => {
    observe.mockClear();
    disconnect.mockClear();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resize = callback;
        }

        observe = observe;
        disconnect = disconnect;
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function setup(
    template = `
      <div angStickyHeader>
        <div class="datatable-grid"><datatable-header>Name</datatable-header></div>
      </div>
    `,
  ) {
    const result = await render(template, { imports: [StickyHeader], schemas: [CUSTOM_ELEMENTS_SCHEMA] });
    const grid = result.container.querySelector('.datatable-grid') as HTMLElement;
    const header = result.container.querySelector('datatable-header') as HTMLElement;
    const resizeTo = (gridHeight: number, headerHeight: number) => {
      grid.getBoundingClientRect = () => ({ height: gridHeight }) as DOMRect;
      header.getBoundingClientRect = () => ({ height: headerHeight }) as DOMRect;
      resize();
    };

    return { ...result, grid, header, resizeTo };
  }

  it('observes the grid and the header', async () => {
    const { grid, header } = await setup();

    expect(observe).toHaveBeenCalledWith(grid);
    expect(observe).toHaveBeenCalledWith(header);
  });

  it('exposes the heights of the grid and the header on the grid whenever they change', async () => {
    const { grid, resizeTo } = await setup();

    resizeTo(900, 48);
    expect(grid.style.getPropertyValue('--_ang-table-grid-height')).toBe('900px');
    expect(grid.style.getPropertyValue('--_ang-table-header-height')).toBe('48px');

    resizeTo(1200, 64);
    expect(grid.style.getPropertyValue('--_ang-table-grid-height')).toBe('1200px');
    expect(grid.style.getPropertyValue('--_ang-table-header-height')).toBe('64px');
  });

  it('stops observing when destroyed', async () => {
    const { fixture } = await setup();

    fixture.destroy();

    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('does nothing without a header', async () => {
    await setup('<div angStickyHeader><div class="datatable-grid"></div></div>');

    expect(observe).not.toHaveBeenCalled();
  });
});
