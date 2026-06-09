import { Component, Type, viewChild } from '@angular/core';
import { RESIZE_OBSERVER } from '@atlasng/core';
import { render, RenderComponentOptions, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import {
  CookieBanner,
  CookieBannerAction,
  CookieBannerContainer,
  CookieBannerDescription,
  CookieBannerLogo,
  CookieBannerTitle,
} from './cookie-banner';

@Component({
  imports: [CookieBanner, CookieBannerLogo, CookieBannerTitle, CookieBannerDescription, CookieBannerAction],
  template: `
    <ang-cookie-banner data-testid="custom-cookie-banner" [closeOnClick]="bannerCloseOnClick" #banner>
      <img angCookieBannerLogo alt="Site logo" src="/logo.svg" />
      <ang-cookie-banner-title id="custom-title">Custom privacy title</ang-cookie-banner-title>
      <ang-cookie-banner-description>Custom cookie description</ang-cookie-banner-description>
      <button angCookieBannerAction>Dismiss</button>
      <button angCookieBannerAction [closeOnClick]="false">Keep open</button>
    </ang-cookie-banner>
  `,
})
class CustomContentHost {
  readonly banner = viewChild.required(CookieBanner);
  bannerCloseOnClick = true;
}

@Component({
  imports: [CookieBanner, CookieBannerContainer],
  template: `
    <div angCookieBannerContainer>
      <ang-cookie-banner />
    </div>
  `,
})
class CookieBannerContainerHost {}

describe('CookieBanner', () => {
  async function sharedSetup<T>(component: Type<T>, options?: RenderComponentOptions<T>) {
    const user = userEvent.setup();
    let resizeObserverCallback: ResizeObserverCallback | undefined;
    const resizeObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    };
    class ResizeObserverMock {
      constructor(callback: ResizeObserverCallback) {
        resizeObserverCallback = callback;
        // eslint-disable-next-line no-constructor-return
        return resizeObserver;
      }
    }

    const result = await render(component, {
      ...options,
      providers: [
        ...(options?.providers ?? []),
        {
          provide: RESIZE_OBSERVER,
          useValue: ResizeObserverMock,
        },
      ],
    });
    return {
      ...result,
      user,
      resizeObserver,
      emitResize(blockSize: number): void {
        resizeObserverCallback?.(
          [
            {
              borderBoxSize: [{ blockSize }],
            } as unknown as ResizeObserverEntry,
          ],
          resizeObserver as unknown as ResizeObserver,
        );
      },
    };
  }

  async function setup(options?: RenderComponentOptions<CookieBanner>) {
    return await sharedSetup(CookieBanner, options);
  }

  async function setupCustomContent(options?: RenderComponentOptions<CustomContentHost>) {
    return await sharedSetup(CustomContentHost, options);
  }

  async function setupContainerHost(options?: RenderComponentOptions<CookieBannerContainerHost>) {
    return await sharedSetup(CookieBannerContainerHost, options);
  }
  it('renders default title, description, and action buttons', async () => {
    await setup();

    expect(screen.getByRole('heading', { name: 'Manage your privacy preferences' })).toBeVisible();
    expect(
      screen.getByText('Cookies and similar technologies are used to play videos and to improve this website.'),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Allow all' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Allow necessary only' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Customize' })).toBeVisible();
  });

  it('emits allowAll and closes when allow all is clicked', async () => {
    const click = vi.fn();
    const { user } = await setup({ on: { allowAll: click } });
    const bannerElement = screen
      .getByRole('region', { name: 'Manage your privacy preferences' })
      .closest('.ang-cookie-banner') as HTMLElement;

    await user.click(screen.getByRole('button', { name: 'Allow all' }));

    expect(click).toHaveBeenCalledOnce();
    await waitFor(() => expect(bannerElement).toHaveClass('ang-cookie-banner-closed'));
  });

  it('keeps the banner open when closeOnClick is disabled', async () => {
    const click = vi.fn();
    const { user } = await setup({ inputs: { closeOnClick: false }, on: { allowNecessary: click } });

    await user.click(screen.getByRole('button', { name: 'Allow necessary only' }));

    expect(click).toHaveBeenCalledOnce();
    expect(screen.getByRole('heading', { name: 'Manage your privacy preferences' })).toBeVisible();
  });

  it('emits customize when customize action is clicked', async () => {
    const click = vi.fn();
    const { user } = await setup({ inputs: { closeOnClick: false }, on: { customize: click } });

    await user.click(screen.getByRole('button', { name: 'Customize' }));

    expect(click).toHaveBeenCalledOnce();
  });

  it('does not render a privacy policy link when privacyPolicy input is not provided', async () => {
    await setup();

    expect(screen.queryByRole('link', { name: /privacy policy/i })).not.toBeInTheDocument();
  });

  it('renders a privacy policy link when privacyPolicy input is provided', async () => {
    await setup({ inputs: { privacyPolicy: 'https://example.com/privacy' } });

    const link = screen.getByRole('link', { name: /privacy policy/i });
    expect(link).toHaveAttribute('href', 'https://example.com/privacy');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('uses projected title content and associates section aria-labelledby with the title id', async () => {
    await setupCustomContent();

    const section = screen.getByRole('region', { name: 'Custom privacy title' });

    expect(screen.getByText('Custom cookie description')).toBeVisible();
    expect(section).toHaveAttribute('aria-labelledby', 'custom-title');
  });

  it('renders projected logo content', async () => {
    await setupCustomContent();

    expect(screen.getByRole('img', { name: 'Site logo' })).toBeVisible();
  });

  it('supports projected cookie banner actions with per-action close behavior', async () => {
    const user = userEvent.setup();
    await setupCustomContent();
    const bannerElement = screen.getByTestId('custom-cookie-banner');

    await user.click(screen.getByRole('button', { name: 'Keep open' }));
    expect(screen.getByText('Custom privacy title')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    await waitFor(() => expect(bannerElement).toHaveClass('ang-cookie-banner-closed'));
  });

  it('reopens the banner when open is called after close', async () => {
    const { fixture } = await setupCustomContent();
    const banner = fixture.componentInstance.banner();
    const bannerElement = screen.getByTestId('custom-cookie-banner');

    banner.close();
    fixture.detectChanges();

    await waitFor(() => expect(bannerElement).toHaveClass('ang-cookie-banner-closed'));

    banner.open();
    fixture.detectChanges();

    expect(bannerElement).toHaveClass('ang-cookie-banner-opened');
  });

  it('can be anchored to a container component', async () => {
    await expect(setupContainerHost()).resolves.toBeDefined();
  });

  it('works when ResizeObserver is not available', async () => {
    const user = userEvent.setup();
    const allowAll = vi.fn();

    await render(CookieBanner, {
      providers: [{ provide: RESIZE_OBSERVER, useValue: undefined }],
      on: { allowAll },
    });

    const bannerElement = screen
      .getByRole('region', { name: 'Manage your privacy preferences' })
      .closest('.ang-cookie-banner') as HTMLElement;

    await user.click(screen.getByRole('button', { name: 'Allow all' }));

    expect(allowAll).toHaveBeenCalledOnce();
    await waitFor(() => expect(bannerElement).toHaveClass('ang-cookie-banner-closed'));
  });

  it('updates container spacing when resize observer reports a new height', async () => {
    const { emitResize } = await setupContainerHost();
    const container = document.querySelector('.ang-cookie-banner-container') as HTMLElement;

    emitResize(72);

    await waitFor(() => expect(container).toHaveStyle({ '--ang-cookie-banner-spacing': '72px' }));
  });
});
