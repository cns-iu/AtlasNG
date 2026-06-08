import { Component, viewChild } from '@angular/core';
import { render, RenderComponentOptions, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { CookieBanner, CookieBannerAction, CookieBannerDescription, CookieBannerTitle } from './cookie-banner';

@Component({
  imports: [CookieBanner, CookieBannerTitle, CookieBannerDescription, CookieBannerAction],
  template: `
    <ang-cookie-banner [closeOnClick]="bannerCloseOnClick" #banner>
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

describe('CookieBanner', () => {
  async function setup(options?: RenderComponentOptions<CookieBanner>) {
    const user = userEvent.setup();
    const result = await render(CookieBanner, options);

    return {
      ...result,
      user,
    };
  }

  it('renders default title, description, and action buttons', async () => {
    await setup();

    expect(screen.getByRole('heading', { name: 'Manage your privacy preferences' })).toBeInTheDocument();
    expect(
      screen.getByText('Cookies and similar technologies are used to play videos and to improve this website.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Allow all' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Allow necessary only' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Customize' })).toBeInTheDocument();
  });

  it('emits allowAll and closes when allow all is clicked', async () => {
    const click = vi.fn();
    const { user } = await setup({ on: { allowAll: click } });

    await user.click(screen.getByRole('button', { name: 'Allow all' }));

    expect(click).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Manage your privacy preferences' })).not.toBeInTheDocument();
    });
  });

  it('keeps the banner open when closeOnClick is disabled', async () => {
    const click = vi.fn();
    const { user } = await setup({ inputs: { closeOnClick: false }, on: { allowNecessary: click } });

    await user.click(screen.getByRole('button', { name: 'Allow necessary only' }));

    expect(click).toHaveBeenCalledOnce();
    expect(screen.getByRole('heading', { name: 'Manage your privacy preferences' })).toBeInTheDocument();
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
    await render(CustomContentHost);

    const section = screen.getByRole('region', { name: 'Custom privacy title' });

    expect(screen.getByText('Custom cookie description')).toBeInTheDocument();
    expect(section).toHaveAttribute('aria-labelledby', 'custom-title');
  });

  it('supports projected cookie banner actions with per-action close behavior', async () => {
    const user = userEvent.setup();
    await render(CustomContentHost);

    await user.click(screen.getByRole('button', { name: 'Keep open' }));
    expect(screen.getByText('Custom privacy title')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    await waitFor(() => {
      expect(screen.queryByText('Custom privacy title')).not.toBeInTheDocument();
    });
  });

  it('reopens the banner when open is called after close', async () => {
    const { fixture } = await render(CustomContentHost);
    const banner = fixture.componentInstance.banner();

    banner.close();
    fixture.detectChanges();

    await waitFor(() => {
      expect(screen.queryByText('Custom privacy title')).not.toBeInTheDocument();
    });

    banner.open();
    fixture.detectChanges();

    expect(screen.getByText('Custom privacy title')).toBeInTheDocument();
  });
});
