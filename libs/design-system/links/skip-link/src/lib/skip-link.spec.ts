import { signal } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { SkipLink } from './skip-link';
import { SkipLinkTarget } from './skip-link-target';

describe('SkipLink', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    delete (Element.prototype as Partial<Element>).scrollIntoView;
  });

  async function setup(template: string, componentProperties: Record<string, unknown> = {}) {
    const result = await render(template, { imports: [SkipLink, SkipLinkTarget], componentProperties });
    return { ...result, user: userEvent.setup() };
  }

  it('renders with the default label', async () => {
    await render(SkipLink, { inputs: { anchorId: 'main-content' } });

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toBeInTheDocument();
  });

  it('renders with a custom label', async () => {
    await render(SkipLink, { inputs: { anchorId: 'main-content', label: 'Skip to content area' } });

    expect(screen.getByRole('link', { name: 'Skip to content area' })).toBeInTheDocument();
  });

  it('links to the anchor as a fragment', async () => {
    await render(SkipLink, { inputs: { anchorId: 'page-main' } });

    expect(screen.getByRole('link')).toHaveAttribute('href', '#page-main');
  });

  it('links to the skip link target without an anchor id', async () => {
    await setup('<ang-skip-link /><main angSkipLinkTarget>Main content</main>');
    const main = screen.getByRole('main');

    expect(main.id).toMatch(/^ang-skip-link-target/);
    expect(screen.getByRole('link')).toHaveAttribute('href', `#${main.id}`);
  });

  it('prefers the anchor id over the skip link target', async () => {
    await setup('<ang-skip-link anchorId="page-main" /><main angSkipLinkTarget id="target">Main content</main>');

    expect(screen.getByRole('link')).toHaveAttribute('href', '#page-main');
  });

  it('links to the target that comes first in the document', async () => {
    const showFirst = signal(false);
    const { detectChanges } = await setup(
      `<ang-skip-link />
      @if (showFirst()) {
        <div angSkipLinkTarget id="first">First</div>
      }
      <main angSkipLinkTarget id="second">Second</main>`,
      { showFirst },
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', '#second');

    showFirst.set(true);
    detectChanges();

    expect(screen.getByRole('link')).toHaveAttribute('href', '#first');
  });

  it('is disabled and out of the tab order without a target', async () => {
    const { user } = await setup('<ang-skip-link />');

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    await user.tab();
    expect(document.body).toHaveFocus();
  });

  it('follows targets as they are added and removed', async () => {
    const showTarget = signal(false);
    const { detectChanges } = await setup(
      `<ang-skip-link />
      @if (showTarget()) {
        <main angSkipLinkTarget id="target">Main content</main>
      }`,
      { showTarget },
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();

    showTarget.set(true);
    detectChanges();
    expect(screen.getByRole('link')).toHaveAttribute('href', '#target');

    showTarget.set(false);
    detectChanges();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  describe('when activated', () => {
    async function setupWithAnchor(target: string) {
      const { user } = await setup(`<ang-skip-link anchorId="page-main" />${target}`);
      return { link: screen.getByRole('link', { name: 'Skip to main content' }), user };
    }

    it('moves focus to the target and scrolls it into view', async () => {
      const { link, user } = await setupWithAnchor('<main id="page-main">Main content</main>');
      const main = screen.getByRole('main');

      await user.tab();
      expect(link).toHaveFocus();
      await user.keyboard('{Enter}');

      expect(main).toHaveFocus();
      expect(main).toHaveAttribute('tabindex', '-1');
      expect(main.scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
    });

    it('keeps the tabindex of a target that is already focusable', async () => {
      const { link, user } = await setupWithAnchor('<button id="page-main">Main action</button>');
      const target = screen.getByRole('button', { name: 'Main action' });

      await user.click(link);

      expect(target).toHaveFocus();
      expect(target).not.toHaveAttribute('tabindex');
    });

    it('moves focus to the skip link target', async () => {
      const { user } = await setup('<ang-skip-link /><main angSkipLinkTarget>Main content</main>');

      await user.click(screen.getByRole('link'));

      expect(screen.getByRole('main')).toHaveFocus();
    });

    it('stays on the current route', async () => {
      const { link } = await setupWithAnchor('<main id="page-main">Main content</main>');

      expect(fireEvent.click(link)).toBe(false);
    });

    it('stays on the current route and keeps focus when the target is missing', async () => {
      const { link, user } = await setupWithAnchor('');

      expect(fireEvent.click(link)).toBe(false);
      await user.click(link);
      expect(link).toHaveFocus();
    });
  });
});
