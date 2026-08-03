import { MatIconRegistry } from '@angular/material/icon';
import { FakeMatIconRegistry } from '@angular/material/icon/testing';
import { ComponentInput, render, screen } from '@testing-library/angular';
import { provideSocialMediaButtons, SocialMediaButton, SocialMediaButtonDef } from './social-media';

describe('SocialMediaButton', () => {
  type SetupOptions = {
    detectChangesOnRender?: boolean;
    inputs?: ComponentInput<SocialMediaButton>;
    defs?: SocialMediaButtonDef[];
  };

  function setup({ detectChangesOnRender = true, inputs = {}, defs }: SetupOptions = {}) {
    return render(SocialMediaButton, {
      detectChangesOnRender,
      inputs,
      providers: [
        { provide: MatIconRegistry, useClass: FakeMatIconRegistry },
        ...(defs ? [provideSocialMediaButtons(defs)] : []),
      ],
    });
  }

  it('renders a built-in button definition by id', async () => {
    await setup({
      inputs: {
        id: 'linkedin',
      },
    });

    const link = screen.getByRole('link', { name: 'LinkedIn' });
    expect(link).toHaveAttribute('href', 'https://www.linkedin.com/');
  });

  it('renders a link when an explicit def with an icon is provided', async () => {
    await setup({
      inputs: {
        def: {
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

  it('prefers explicit def input over id lookup', async () => {
    await setup({
      inputs: {
        id: 'linkedin',
        def: {
          id: 'override',
          label: 'Override Label',
          url: 'https://example.com/override',
          classes: 'override-class',
        },
      },
    });

    const link = screen.getByRole('link', { name: 'Override Label' });
    expect(link).toHaveAttribute('href', 'https://example.com/override');
  });

  it('uses injected definitions before built-in defaults', async () => {
    await setup({
      inputs: {
        id: 'linkedin',
      },
      defs: [
        {
          id: 'linkedin',
          label: 'Injected LinkedIn',
          url: 'https://example.com/injected-linkedin',
          classes: 'injected-linkedin',
        },
      ],
    });

    const link = screen.getByRole('link', { name: 'Injected LinkedIn' });
    expect(link).toHaveAttribute('href', 'https://example.com/injected-linkedin');
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

    it('renders the fallback when neither id nor def are provided', async () => {
      const { fixture } = await setup({ detectChangesOnRender: false });

      runWithProdMode(() => {
        fixture.detectChanges();
        const link = screen.getByRole('link', { name: 'Not available' });
        expect(link).toHaveAttribute('href', '#');
      });
    });

    it('renders the fallback when id cannot be resolved', async () => {
      const { fixture } = await setup({
        detectChangesOnRender: false,
        inputs: {
          id: 'not-a-real-platform',
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
    it('throws when neither id nor def are provided', async () => {
      await expect(setup()).rejects.toThrowErrorMatchingInlineSnapshot(
        `[Error: SocialMediaButton requires an id or def input]`,
      );
    });

    it('throws when id cannot be resolved', async () => {
      await expect(
        setup({
          inputs: {
            id: 'not-a-real-platform',
          },
        }),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `[Error: No definition found for SocialMediaButton with id "not-a-real-platform"]`,
      );
    });
  });
});
