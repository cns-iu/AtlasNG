import { By } from '@angular/platform-browser';
import { fireEvent, render } from '@testing-library/angular';
import { NgScrollbar, ViewportAdapter } from 'ngx-scrollbar';
import { ScrollAreaStickyScrollbar } from './scroll-area-sticky-scrollbar';

describe('ScrollAreaStickyScrollbar', () => {
  async function setup() {
    const result = await render(
      `<ng-scrollbar #scrollbar="ngScrollbar">Content</ng-scrollbar>
      <ang-scroll-area-sticky-scrollbar [viewport]="scrollbar.adapter" />`,
      { imports: [NgScrollbar, ScrollAreaStickyScrollbar] },
    );
    const sticky = result.fixture.debugElement.query(By.directive(ScrollAreaStickyScrollbar));
    const [viewport, scrollbar] = result.fixture.debugElement
      .queryAll(By.directive(NgScrollbar))
      .map((element) => element.injector.get(ViewportAdapter));

    return { ...result, host: sticky.nativeElement as HTMLElement, viewport, scrollbar };
  }

  it('shows a horizontal scrollbar whenever the viewport can scroll sideways', async () => {
    const { scrollbar } = await setup();

    expect(scrollbar.viewportElement).toHaveAttribute('orientation', 'horizontal');
    expect(scrollbar.viewportElement).toHaveAttribute('visibility', 'native');
  });

  it('is hidden from assistive technology', async () => {
    const { host } = await setup();

    expect(host).toHaveAttribute('aria-hidden', 'true');
  });

  it('replaces the horizontal scrollbar of the viewport', async () => {
    const { fixture, viewport } = await setup();

    expect(viewport.viewportElement).toHaveClass('ang-scroll-area-sticky-scrollbar--viewport');

    fixture.destroy();

    expect(viewport.viewportElement).not.toHaveClass('ang-scroll-area-sticky-scrollbar--viewport');
  });

  it('scrolls exactly as far sideways as the viewport', async () => {
    const { fixture, host, viewport, scrollbar } = await setup();

    viewport.contentDimension.set({ width: 900, height: 100 });
    viewport.viewportDimension.set({ width: 400, height: 100 });
    scrollbar.viewportDimension.set({ width: 380, height: 16 });
    fixture.detectChanges();

    expect(host.querySelector('.ang-scroll-area-sticky-scrollbar--content')).toHaveStyle({ width: '880px' });
  });

  it('keeps the horizontal scroll positions of the viewport and the scrollbar in step', async () => {
    const { viewport, scrollbar } = await setup();

    viewport.viewportElement.scrollLeft = 120;
    fireEvent.scroll(viewport.viewportElement);
    expect(scrollbar.viewportElement.scrollLeft).toBe(120);

    scrollbar.viewportElement.scrollLeft = 40;
    fireEvent.scroll(scrollbar.viewportElement);
    expect(viewport.viewportElement.scrollLeft).toBe(40);
  });
});
