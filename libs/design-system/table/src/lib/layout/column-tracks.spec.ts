import { columnTracks } from './column-tracks';

describe('columnTracks', () => {
  it('lets growing columns grow from their minimum to their maximum width', () => {
    expect(
      columnTracks([
        { minWidth: 200, maxWidth: 640, flexGrow: 1 },
        { maxWidth: 132, flexGrow: 1 },
      ]),
    ).toBe('minmax(200px, 640px) minmax(0px, 132px)');
  });

  it('shares the remaining width by flexGrow when growing columns have no maximum', () => {
    expect(columnTracks([{ minWidth: 100, flexGrow: 1 }, { flexGrow: 3 }])).toBe('minmax(100px, 1fr) minmax(0px, 3fr)');
  });

  it('sizes fitContent columns to their content', () => {
    expect(columnTracks([{ fitContent: true, minWidth: 100, maxWidth: 240, flexGrow: 1 }])).toBe('max-content');
  });

  it('keeps the width of columns that do not grow or resize, within their limits', () => {
    expect(
      columnTracks([
        {},
        { width: 80, canAutoResize: false, flexGrow: 1 },
        { width: 10, minWidth: 20 },
        { width: 300, maxWidth: 200, flexGrow: 0 },
      ]),
    ).toBe('150px 80px 20px 200px');
  });

  it('orders the tracks the way ngx-datatable renders frozen columns', () => {
    expect(columnTracks([{ width: 50 }, { width: 60, frozenRight: true }, { width: 70, frozenLeft: true }])).toBe(
      '70px 50px 60px',
    );
  });
});
