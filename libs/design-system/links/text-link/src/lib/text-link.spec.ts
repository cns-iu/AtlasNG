import { FocusMonitor } from '@angular/cdk/a11y';
import { Component, viewChild } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { TextLink } from './text-link';

@Component({
  imports: [TextLink],
  template: `<a angTextLink href="https://example.com">Read more</a>`,
})
class TestHostComponent {
  readonly textLink = viewChild.required(TextLink);
}

describe('TextLink', () => {
  const focusOptions: FocusOptions = {
    preventScroll: true,
  };

  async function setup() {
    const focusVia = vi.fn();

    const result = await render(TestHostComponent, {
      providers: [
        {
          provide: FocusMonitor,
          useValue: {
            focusVia,
          },
        },
      ],
    });

    return {
      ...result,
      focusVia,
    };
  }

  it('should render', async () => {
    await expect(setup()).resolves.toBeDefined();
  });

  it('focuses via the Angular CDK focus monitor when an origin is provided', async () => {
    const { focusVia, fixture } = await setup();
    const link = screen.getByRole('link', { name: 'Read more' });
    const textLink = fixture.componentInstance.textLink();

    textLink.focus('keyboard', focusOptions);

    expect(focusVia).toHaveBeenCalledTimes(1);
    expect(focusVia).toHaveBeenCalledWith(link, 'keyboard', focusOptions);
  });

  it('falls back to native focus when origin is null', async () => {
    const { focusVia, fixture } = await setup();
    const link = screen.getByRole('link', { name: 'Read more' }) as HTMLAnchorElement;
    const focus = vi.spyOn(link, 'focus').mockImplementation(() => undefined);
    const textLink = fixture.componentInstance.textLink();

    textLink.focus(null, focusOptions);

    expect(focus).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenCalledWith(focusOptions);
    expect(focusVia).not.toHaveBeenCalled();
  });
});
