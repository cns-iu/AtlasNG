import { MatIconRegistry } from '@angular/material/icon';
import { FakeMatIconRegistry } from '@angular/material/icon/testing';
import { render, screen } from '@testing-library/angular';
import { SocialMediaButton } from './social-media-button';
import { provideSocialMediaButtons, type SocialMediaButtonDefinition } from './social-media-button-definitions';

describe('SocialMediaButton', () => {
  type SetupOptions = {
    detectChangesOnRender?: boolean;
    inputs?: { social?: string | SocialMediaButtonDefinition };
    definitions?: SocialMediaButtonDefinition[][];
  };

  function setup({ detectChangesOnRender = true, inputs = {}, definitions }: SetupOptions = {}) {
    return render(SocialMediaButton, {
      detectChangesOnRender,
      inputs,
      providers: [
        { provide: MatIconRegistry, useClass: FakeMatIconRegistry },
        ...(definitions ?? []).map((group) => provideSocialMediaButtons(group)),
      ],
    });
  }

  it('renders a built-in button definition by id', async () => {
    await setup({
      inputs: {
        social: 'linkedin',
      },
    });

    const link = screen.getByRole('link', { name: 'LinkedIn' });
    expect(link).toHaveAttribute('href', 'https://www.linkedin.com/');
  });

  it('renders a link when an explicit definition with an icon is provided', async () => {
    await setup({
      inputs: {
        social: {
          id: 'custom',
          label: 'Custom',
          url: 'https://example.com/custom',
          classes: 'custom-class',
          icon: 'star',
        },
      },
    });

    const link = screen.getByRole('link', { name: 'Custom' });
    expect(link).toHaveAttribute('href', 'https://example.com/custom');
  });

  it('uses injected definitions before built-in defaults', async () => {
    await setup({
      inputs: {
        social: 'linkedin',
      },
      definitions: [
        [
          {
            id: 'linkedin',
            label: 'Injected LinkedIn',
            url: 'https://example.com/injected-linkedin',
            classes: 'injected-linkedin',
          },
        ],
      ],
    });

    const link = screen.getByRole('link', { name: 'Injected LinkedIn' });
    expect(link).toHaveAttribute('href', 'https://example.com/injected-linkedin');
  });

  it('combines multiple registrations and prefers the last matching definition', async () => {
    await setup({
      inputs: {
        social: 'mastodon',
      },
      definitions: [
        [
          { id: 'mastodon', label: 'First Mastodon', url: 'https://example.com/first', fontIcon: 'public' },
          { id: 'threads', label: 'Threads', url: 'https://example.com/threads', fontIcon: 'forum' },
        ],
        [{ id: 'mastodon', label: 'Second Mastodon', url: 'https://example.com/second', fontIcon: 'public' }],
      ],
    });

    const link = screen.getByRole('link', { name: 'Second Mastodon' });
    expect(link).toHaveAttribute('href', 'https://example.com/second');
  });

  describe('in production mode', () => {
    function runWithProdMode<T>(callback: () => T): T {
      const global = globalThis as Record<string, unknown>;
      const originalNgDevMode = global['ngDevMode'];
      global['ngDevMode'] = false;
      try {
        return callback();
      } finally {
        global['ngDevMode'] = originalNgDevMode;
      }
    }

    it('renders the fallback when id cannot be resolved', async () => {
      const { fixture } = await setup({
        detectChangesOnRender: false,
        inputs: {
          social: 'not-a-real-platform',
        },
      });

      runWithProdMode(() => {
        fixture.detectChanges();
        const link = screen.getByRole('link', { name: 'Not available' });
        expect(link).toHaveAttribute('href', '#');
      });
    });
  });

  describe('in development mode', () => {
    it('throws when id cannot be resolved', async () => {
      await expect(
        setup({
          inputs: {
            social: 'not-a-real-platform',
          },
        }),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `[AngError: ANG4003: No definition found for SocialMediaButton with id "not-a-real-platform"]`,
      );
    });
  });
});
