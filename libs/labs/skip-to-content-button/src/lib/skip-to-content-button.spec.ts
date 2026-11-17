import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { SkipToContentButton } from './skip-to-content-button';

describe('SkipToContentButton', () => {
  it('renders with default label', async () => {
    await render(SkipToContentButton, {
      inputs: {
        anchorId: 'main-content',
      },
    });

    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
  });

  it('renders with custom label', async () => {
    await render(SkipToContentButton, {
      inputs: {
        anchorId: 'main-content',
        label: 'Skip to content area',
      },
    });

    expect(screen.getByText('Skip to content area')).toBeInTheDocument();
  });

  it('links to the anchor as a fragment', async () => {
    await render(SkipToContentButton, {
      inputs: {
        anchorId: 'page-main',
      },
    });

    expect(screen.getByRole('link')).toHaveAttribute('href', '#page-main');
  });

  describe('when activated', () => {
    beforeEach(() => {
      Element.prototype.scrollIntoView = vi.fn();
    });

    afterEach(() => {
      delete (Element.prototype as Partial<Element>).scrollIntoView;
    });

    async function setup(target: string) {
      await render(`<ang-skip-to-content-button anchorId="page-main" />${target}`, {
        imports: [SkipToContentButton],
      });

      return { link: screen.getByRole('link', { name: 'Skip to main content' }), user: userEvent.setup() };
    }

    it('moves focus to the target and scrolls it into view', async () => {
      const { link, user } = await setup('<main id="page-main">Main content</main>');
      const main = screen.getByRole('main');

      await user.tab();
      expect(link).toHaveFocus();
      await user.keyboard('{Enter}');

      expect(main).toHaveFocus();
      expect(main).toHaveAttribute('tabindex', '-1');
      expect(main.scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
    });

    it('keeps the tabindex of a target that is already focusable', async () => {
      const { link, user } = await setup('<button id="page-main">Main action</button>');
      const target = screen.getByRole('button', { name: 'Main action' });

      await user.click(link);

      expect(target).toHaveFocus();
      expect(target).not.toHaveAttribute('tabindex');
    });

    it('stays on the current route', async () => {
      const { link } = await setup('<main id="page-main">Main content</main>');

      expect(fireEvent.click(link)).toBe(false);
    });

    it('stays on the current route and keeps focus when the target is missing', async () => {
      const { link, user } = await setup('');

      expect(fireEvent.click(link)).toBe(false);
      await user.click(link);
      expect(link).toHaveFocus();
    });
  });
});
