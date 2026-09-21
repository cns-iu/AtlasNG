import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { BreadcrumbItem } from '@atlasng/design-system/buttons/breadcrumbs';
import { PageSectionHeader } from './page-section-header';

describe('PageSectionHeader', () => {
  async function setup(
    template = '<ang-page-section-header>Page Label</ang-page-section-header>',
    componentProperties: Record<string, unknown> = {},
  ) {
    const user = userEvent.setup();
    const result = await render(template, { imports: [PageSectionHeader], componentProperties });

    return { ...result, user };
  }

  it('renders the page label as an h1', async () => {
    await setup();

    expect(screen.getByRole('heading', { level: 1, name: 'Page Label' })).toBeInTheDocument();
  });

  it('renders breadcrumbs when items are provided', async () => {
    const breadcrumbs: BreadcrumbItem[] = [{ name: 'Home' }, { name: 'Label' }];
    await setup('<ang-page-section-header [breadcrumbs]="breadcrumbs">Page Label</ang-page-section-header>', {
      breadcrumbs,
    });

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Label')).toBeInTheDocument();
  });

  it('does not render breadcrumbs when showBreadcrumbs is false', async () => {
    const breadcrumbs: BreadcrumbItem[] = [{ name: 'Home' }, { name: 'Label' }];
    await setup(
      `<ang-page-section-header [showBreadcrumbs]="false" [breadcrumbs]="breadcrumbs">Page Label</ang-page-section-header>`,
      { breadcrumbs },
    );

    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });

  it('does not render breadcrumbs when no items are provided', async () => {
    await setup();

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('renders the description when provided', async () => {
    await setup(
      `<ang-page-section-header description="Short description of content.">Page Label</ang-page-section-header>`,
    );

    expect(screen.getByText('Short description of content.')).toBeInTheDocument();
  });

  it('does not render the description when showDescription is false', async () => {
    await setup(
      `<ang-page-section-header [showDescription]="false" description="Short description of content.">Page Label</ang-page-section-header>`,
    );

    expect(screen.queryByText('Short description of content.')).not.toBeInTheDocument();
  });

  it('renders a primary and secondary action button by default', async () => {
    await setup(
      `<ang-page-section-header primaryActionLabel="Action" secondaryActionLabel="Cancel">Page Label</ang-page-section-header>`,
    );

    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('does not render the button group when showButtonGroup is false', async () => {
    await setup(
      `<ang-page-section-header [showButtonGroup]="false" primaryActionLabel="Action" secondaryActionLabel="Cancel">Page Label</ang-page-section-header>`,
    );

    expect(screen.queryByRole('button', { name: 'Action' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  it('does not render the secondary action button when showSecondaryButton is false', async () => {
    await setup(
      `<ang-page-section-header [showSecondaryButton]="false" primaryActionLabel="Action" secondaryActionLabel="Cancel">Page Label</ang-page-section-header>`,
    );

    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  it('emits primaryAction when the primary button is clicked', async () => {
    const primaryAction = vi.fn();
    const { user } = await setup(
      `<ang-page-section-header primaryActionLabel="Action" (primaryAction)="primaryAction()">Page Label</ang-page-section-header>`,
      { primaryAction },
    );

    await user.click(screen.getByRole('button', { name: 'Action' }));

    expect(primaryAction).toHaveBeenCalledOnce();
  });

  it('emits secondaryAction when the secondary button is clicked', async () => {
    const secondaryAction = vi.fn();
    const { user } = await setup(
      `<ang-page-section-header primaryActionLabel="Action" secondaryActionLabel="Cancel" (secondaryAction)="secondaryAction()">Page Label</ang-page-section-header>`,
      { secondaryAction },
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(secondaryAction).toHaveBeenCalledOnce();
  });
});
