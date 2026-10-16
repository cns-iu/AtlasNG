import { render, screen } from '@testing-library/angular';
import { ErrorPage, ErrorPageAction, ErrorPageDescription, ErrorPageTitle } from './error-page';

describe('ErrorPage', () => {
  it('projects the element form of the title, description, and actions', async () => {
    await render(
      `<ang-error-page>
        <ang-error-page-title>Custom title</ang-error-page-title>
        <ang-error-page-description>Custom description</ang-error-page-description>
        <ang-error-page-action><button>Custom action</button></ang-error-page-action>
      </ang-error-page>`,
      { imports: [ErrorPage, ErrorPageTitle, ErrorPageDescription, ErrorPageAction] },
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Custom title' })).toBeVisible();
    expect(screen.getByText('Custom title')).toHaveClass('ang-error-page--title-content');
    expect(screen.getByText('Custom description')).toHaveClass('ang-error-page--description-content');
    expect(screen.getByRole('button', { name: 'Custom action' }).parentElement).toHaveClass('ang-error-page--action');
  });

  it('applies the same classes to the attribute form of the directives', async () => {
    await render(
      `<ang-error-page>
        <span angErrorPageTitle>Custom title</span>
        <span angErrorPageDescription>Custom description</span>
        <button angErrorPageAction>Custom action</button>
      </ang-error-page>`,
      { imports: [ErrorPage, ErrorPageTitle, ErrorPageDescription, ErrorPageAction] },
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Custom title' })).toBeVisible();
    expect(screen.getByText('Custom title')).toHaveClass('ang-error-page--title-content');
    expect(screen.getByText('Custom description')).toHaveClass('ang-error-page--description-content');
    expect(screen.getByRole('button', { name: 'Custom action' })).toHaveClass('ang-error-page--action');
  });
});
