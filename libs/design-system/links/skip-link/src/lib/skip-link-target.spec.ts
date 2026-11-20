import { render, screen } from '@testing-library/angular';
import { SkipLinkTarget } from './skip-link-target';

describe('SkipLinkTarget', () => {
  async function setup(template: string) {
    await render(template, { imports: [SkipLinkTarget] });
  }

  it('generates an id when the element has none', async () => {
    await setup('<main angSkipLinkTarget>Main content</main>');

    expect(screen.getByRole('main').id).toMatch(/^ang-skip-link-target/);
  });

  it('keeps the id of the element', async () => {
    await setup('<main angSkipLinkTarget id="main-content">Main content</main>');

    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });

  it('makes an element that cannot receive focus focusable outside the tab order', async () => {
    await setup('<main angSkipLinkTarget>Main content</main>');

    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1');
  });

  it('keeps the tabindex of the element', async () => {
    await setup('<main angSkipLinkTarget tabindex="0">Main content</main>');

    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '0');
  });

  it('adds no tabindex to an element that can receive focus', async () => {
    await setup('<button angSkipLinkTarget type="button">Main action</button>');

    expect(screen.getByRole('button')).not.toHaveAttribute('tabindex');
  });
});
