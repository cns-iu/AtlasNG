import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { fireEvent, render, screen } from '@testing-library/angular';
import { NgScrollbar, type ScrollbarOrientation, type ScrollbarVisibility } from 'ngx-scrollbar';
import { ScrollArea } from './scroll-area';

describe('ScrollArea', () => {
  it('renders projected content inside the host', async () => {
    const { fixture } = await render('<ang-scroll-area><p>Scrollable content</p></ang-scroll-area>', {
      imports: [ScrollArea],
    });

    const host = fixture.debugElement.query(By.directive(ScrollArea)).nativeElement;
    expect(host).toHaveClass('ang-scroll-area');
    expect(host).toContainElement(screen.getByText('Scrollable content'));
  });

  it('uses the compact hover scrollbar by default', async () => {
    const { fixture } = await render('<ang-scroll-area>Content</ang-scroll-area>', { imports: [ScrollArea] });

    const scrollbar = fixture.debugElement.query(By.directive(NgScrollbar)).nativeElement;
    expect(scrollbar).toHaveClass('ang-scroll-area--viewport');
    expect(scrollbar).toHaveAttribute('appearance', 'compact');
    expect(scrollbar).toHaveAttribute('visibility', 'hover');
    expect(scrollbar).toHaveAttribute('orientation', 'auto');
    expect(scrollbar).toHaveAttribute('position', 'native');
  });

  it('forwards its inputs to ngx-scrollbar', async () => {
    const orientation = signal<ScrollbarOrientation>('vertical');
    const visibility = signal<ScrollbarVisibility>('visible');
    const { fixture } = await render(
      `<ang-scroll-area [orientation]="orientation()" [visibility]="visibility()" position="invertY">
        Content
      </ang-scroll-area>`,
      { imports: [ScrollArea], componentProperties: { orientation, visibility } },
    );

    const scrollbar = fixture.debugElement.query(By.directive(NgScrollbar)).nativeElement;
    expect(scrollbar).toHaveAttribute('orientation', 'vertical');
    expect(scrollbar).toHaveAttribute('visibility', 'visible');
    expect(scrollbar).toHaveAttribute('position', 'invertY');

    orientation.set('horizontal');
    visibility.set('hover');
    fixture.detectChanges();

    expect(scrollbar).toHaveAttribute('orientation', 'horizontal');
    expect(scrollbar).toHaveAttribute('visibility', 'hover');
  });

  describe('edge fades', () => {
    /** Renders a scrollbar and fakes its viewport dimensions, since jsdom does not lay out content. */
    async function setup(template = '<ang-scroll-area>Content</ang-scroll-area>') {
      const result = await render(template, { imports: [ScrollArea] });
      const host = result.fixture.debugElement.query(By.directive(ScrollArea)).nativeElement as HTMLElement;
      const scrollbar = result.fixture.debugElement.query(By.directive(NgScrollbar)).componentInstance as NgScrollbar;
      const viewport = scrollbar.adapter.viewportElement;
      Object.defineProperty(viewport, 'scrollHeight', { configurable: true, value: 1000 });
      Object.defineProperty(viewport, 'clientHeight', { configurable: true, value: 300 });

      const scrollTo = (top: number) => {
        viewport.scrollTop = top;
        fireEvent.scroll(viewport);
        result.fixture.detectChanges();
      };

      return { ...result, host, scrollTo };
    }

    it('fades only the bottom edge at the top of the content', async () => {
      const { host, scrollTo } = await setup();
      scrollTo(0);

      expect(host).not.toHaveClass('ang-scroll-area--fade-top');
      expect(host).toHaveClass('ang-scroll-area--fade-bottom');
    });

    it('fades both edges in the middle of the content', async () => {
      const { host, scrollTo } = await setup();
      scrollTo(350);

      expect(host).toHaveClass('ang-scroll-area--fade-top');
      expect(host).toHaveClass('ang-scroll-area--fade-bottom');
    });

    it('fades only the top edge at the bottom of the content', async () => {
      const { host, scrollTo } = await setup();
      scrollTo(700);

      expect(host).toHaveClass('ang-scroll-area--fade-top');
      expect(host).not.toHaveClass('ang-scroll-area--fade-bottom');
    });

    it('does not fade when the fade input is false', async () => {
      const { host, scrollTo } = await setup('<ang-scroll-area [fade]="false">Content</ang-scroll-area>');
      scrollTo(350);

      expect(host).not.toHaveClass('ang-scroll-area--fade-top');
      expect(host).not.toHaveClass('ang-scroll-area--fade-bottom');
    });
  });
});
