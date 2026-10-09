import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { render, screen } from '@testing-library/angular';
import { NgScrollbar, type ScrollbarOrientation, type ScrollbarVisibility } from 'ngx-scrollbar';
import { Scrollbar } from './scrollbar';

describe('Scrollbar', () => {
  it('renders projected content inside the host', async () => {
    const { fixture } = await render('<ang-scrollbar><p>Scrollable content</p></ang-scrollbar>', {
      imports: [Scrollbar],
    });

    const host = fixture.debugElement.query(By.directive(Scrollbar)).nativeElement;
    expect(host).toHaveClass('ang-scrollbar');
    expect(host).toContainElement(screen.getByText('Scrollable content'));
  });

  it('uses the compact hover scrollbar by default', async () => {
    const { fixture } = await render('<ang-scrollbar>Content</ang-scrollbar>', { imports: [Scrollbar] });

    const scrollbar = fixture.debugElement.query(By.directive(NgScrollbar)).nativeElement;
    expect(scrollbar).toHaveClass('ang-scrollbar--viewport');
    expect(scrollbar).toHaveAttribute('appearance', 'compact');
    expect(scrollbar).toHaveAttribute('visibility', 'hover');
    expect(scrollbar).toHaveAttribute('orientation', 'auto');
    expect(scrollbar).toHaveAttribute('position', 'native');
  });

  it('forwards its inputs to ngx-scrollbar', async () => {
    const orientation = signal<ScrollbarOrientation>('vertical');
    const visibility = signal<ScrollbarVisibility>('visible');
    const { fixture } = await render(
      `<ang-scrollbar [orientation]="orientation()" [visibility]="visibility()" position="invertY">
        Content
      </ang-scrollbar>`,
      { imports: [Scrollbar], componentProperties: { orientation, visibility } },
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
});
