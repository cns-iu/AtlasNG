import { RichTooltip } from '@atlasng/design-system/rich-tooltip';
import { SearchListOption } from '@atlasng/design-system/search-list';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MultiSelectFilter } from './multi-select-filter';

describe('MultiSelectFilter', () => {
  const liver: SearchListOption = { label: 'Liver', count: 10 };
  const kidney: SearchListOption = { label: 'Kidney', count: 5 };
  const options = [liver, kidney];

  async function setup(inputs: Record<string, unknown> = {}) {
    const selectedChange = vi.fn();
    const expandedChange = vi.fn();
    const result = await render(MultiSelectFilter, {
      inputs: { label: 'Organ', options, ...inputs },
    });
    result.fixture.componentInstance.selected.subscribe(selectedChange);
    result.fixture.componentInstance.expanded.subscribe(expandedChange);
    return { ...result, selectedChange, expandedChange };
  }

  async function setupWithInfo(attributes = '') {
    return render(
      `
        <ang-multi-select-filter label="Organ" [options]="options" [infoTooltip]="info" ${attributes} />
        <ang-rich-tooltip #info tagline="About organs" description="Filter by organ" />
      `,
      { imports: [MultiSelectFilter, RichTooltip], componentProperties: { options } },
    );
  }

  it('renders the label button and the number of options as unique item count', async () => {
    await setup();

    expect(screen.getByRole('button', { name: 'Organ' })).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders a custom unique item count', async () => {
    await setup({ count: 1000 });

    expect(screen.getByText('1,000')).toBeInTheDocument();
  });

  it('makes the counter reachable by keyboard and describes it with its tooltip text', async () => {
    const user = userEvent.setup();
    await setup({ count: 1000, countTooltipText: 'Unique organs' });

    await user.tab();
    await user.tab();

    const counter = screen.getByText('1,000');
    expect(counter).toHaveFocus();
    expect(counter).toHaveAccessibleDescription('Unique organs');
  });

  it('hides the info button without an info tooltip', async () => {
    await setup();

    expect(screen.queryByRole('button', { name: 'Organ info' })).not.toBeInTheDocument();
  });

  it('labels the info button with the filter label and describes it with its tooltip text', async () => {
    await setupWithInfo();

    expect(screen.getByRole('button', { name: 'Organ info' })).toHaveAccessibleDescription('Info');
  });

  it('supports custom info button labels', async () => {
    await setupWithInfo('infoLabel="About organs" infoTooltipText="More"');

    expect(screen.getByRole('button', { name: 'About organs' })).toHaveAccessibleDescription('More');
  });

  it('opens the info tooltip and disables the plain tooltip while it is open', async () => {
    const user = userEvent.setup();
    await setupWithInfo();

    const infoButton = screen.getByRole('button', { name: 'Organ info' });
    await user.click(infoButton);

    expect(screen.getByRole('dialog', { name: 'About organs' })).toBeInTheDocument();
    expect(infoButton).not.toHaveAccessibleDescription('Info');
  });

  it('opens the search list from the label button', async () => {
    const user = userEvent.setup();
    const { expandedChange } = await setup();

    const labelButton = screen.getByRole('button', { name: 'Organ' });
    expect(labelButton).toHaveAttribute('aria-haspopup', 'dialog');
    expect(labelButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(labelButton);

    const panel = screen.getByRole('dialog', { name: 'Organ' });
    expect(labelButton).toHaveAttribute('aria-expanded', 'true');
    expect(labelButton).toHaveAttribute('aria-controls', panel.id);
    expect(screen.getByRole('option', { name: /Liver/ })).toBeInTheDocument();
    expect(expandedChange).toHaveBeenLastCalledWith(true);
  });

  it('hides the search field when searchDisabled is set', async () => {
    const user = userEvent.setup();
    await setup({ searchDisabled: true });

    await user.click(screen.getByRole('button', { name: 'Organ' }));

    expect(screen.queryByRole('textbox', { name: 'Search' })).not.toBeInTheDocument();
  });

  it('closes the search list with Escape and returns focus to the label button', async () => {
    const user = userEvent.setup();
    const { expandedChange } = await setup();

    const labelButton = screen.getByRole('button', { name: 'Organ' });
    await user.click(labelButton);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: 'Organ' })).not.toBeInTheDocument();
    expect(labelButton).toHaveAttribute('aria-expanded', 'false');
    expect(labelButton).toHaveFocus();
    expect(expandedChange).toHaveBeenLastCalledWith(false);
  });

  it('closes the search list on an outside click', async () => {
    const user = userEvent.setup();
    await setup();

    await user.click(screen.getByRole('button', { name: 'Organ' }));
    await user.click(document.body);

    expect(screen.queryByRole('dialog', { name: 'Organ' })).not.toBeInTheDocument();
  });

  it('shows options selected in the search list as chips', async () => {
    const user = userEvent.setup();
    const { selectedChange } = await setup();

    await user.click(screen.getByRole('button', { name: 'Organ' }));
    await user.click(screen.getByRole('option', { name: /Liver/ }));

    expect(selectedChange).toHaveBeenLastCalledWith([liver]);
    expect(screen.getByRole('button', { name: 'Remove Liver' })).toBeInTheDocument();
  });

  it('deselects an option when its chip is removed', async () => {
    const user = userEvent.setup();
    const duplicate: SearchListOption = { label: 'Liver' };
    const { selectedChange } = await setup({ options: [liver, duplicate, kidney], selected: [liver, duplicate] });

    expect(screen.getByRole('list', { name: 'Active filters' })).toBeInTheDocument();

    const [removeFirst] = screen.getAllByRole('button', { name: 'Remove Liver' });
    await user.click(removeFirst);

    expect(selectedChange).toHaveBeenLastCalledWith([duplicate]);
    expect(screen.getAllByRole('button', { name: 'Remove Liver' })).toHaveLength(1);
  });

  it('supports custom chip labels', async () => {
    await setup({ selected: [kidney], selectedLabel: 'Selected organs', removeLabel: 'Clear' });

    expect(screen.getByRole('list', { name: 'Selected organs' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear Kidney' })).toBeInTheDocument();
  });

  it('does not render chips without a selection', async () => {
    await setup();

    expect(screen.queryByRole('list', { name: 'Active filters' })).not.toBeInTheDocument();
  });
});
