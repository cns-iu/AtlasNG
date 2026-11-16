import { LiveAnnouncer } from '@angular/cdk/a11y';
import { BreakpointObserver, type BreakpointState } from '@angular/cdk/layout';
import { RichTooltip } from '@atlasng/design-system/rich-tooltip';
import { SearchListOption } from '@atlasng/design-system/search-list';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { BehaviorSubject } from 'rxjs';
import { MultiSelectFilter } from './multi-select-filter';

describe('MultiSelectFilter', () => {
  const liver: SearchListOption = { label: 'Liver', count: 10 };
  const kidney: SearchListOption = { label: 'Kidney', count: 5 };
  const options = [liver, kidney];

  function provideBreakpoint(wide: boolean) {
    const breakpoint = new BehaviorSubject<BreakpointState>({ matches: wide, breakpoints: {} });
    return { breakpoint, providers: [{ provide: BreakpointObserver, useValue: { observe: () => breakpoint } }] };
  }

  async function setup(inputs: Record<string, unknown> = {}, wide = true) {
    const selectedChange = vi.fn();
    const expandedChange = vi.fn();
    const { breakpoint, providers } = provideBreakpoint(wide);
    const result = await render(MultiSelectFilter, {
      inputs: { label: 'Organ', options, ...inputs },
      providers,
    });
    result.fixture.componentInstance.selected.subscribe(selectedChange);
    result.fixture.componentInstance.expanded.subscribe(expandedChange);
    return { ...result, breakpoint, selectedChange, expandedChange };
  }

  async function setupWithInfo(attributes = '') {
    return render(
      `
        <ang-multi-select-filter label="Organ" [options]="options" [infoTooltip]="info" ${attributes} />
        <ang-rich-tooltip #info tagline="About organs" description="Filter by organ" />
      `,
      { imports: [MultiSelectFilter, RichTooltip], componentProperties: { options }, ...provideBreakpoint(true) },
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

  it('announces the number of selected options when the selection changes in the search list', async () => {
    const user = userEvent.setup();
    const { fixture } = await setup({ selected: [kidney] });
    const announce = vi.spyOn(fixture.debugElement.injector.get(LiveAnnouncer), 'announce');

    await user.click(screen.getByRole('button', { name: 'Organ' }));
    await user.click(screen.getByRole('option', { name: /Liver/ }));

    expect(announce).toHaveBeenLastCalledWith('2 selected');
  });

  it('announces the number of selected options when a chip is removed', async () => {
    const user = userEvent.setup();
    const { fixture } = await setup({ selected: [liver, kidney], selectedCountText: 'organs selected' });
    const announce = vi.spyOn(fixture.debugElement.injector.get(LiveAnnouncer), 'announce');

    await user.click(screen.getByRole('button', { name: 'Remove Liver' }));

    expect(announce).toHaveBeenLastCalledWith('1 organs selected');
  });

  it('does not announce selections set by the app', async () => {
    const { fixture, rerender } = await setup();
    const announce = vi.spyOn(fixture.debugElement.injector.get(LiveAnnouncer), 'announce');

    await rerender({ inputs: { label: 'Organ', options, selected: [liver] } });

    expect(announce).not.toHaveBeenCalled();
  });

  it('does not render chips without a selection', async () => {
    await setup();

    expect(screen.queryByRole('list', { name: 'Active filters' })).not.toBeInTheDocument();
  });

  describe('below the medium breakpoint', () => {
    it('opens the search list in a full-screen dialog and moves focus into it', async () => {
      const user = userEvent.setup();
      const { expandedChange } = await setup({ selected: [kidney] }, false);

      await user.click(screen.getByRole('button', { name: 'Organ' }));

      const dialog = await screen.findByRole('dialog', { name: 'Organ' });
      expect(within(dialog).getByRole('heading', { name: 'Organ' })).toBeInTheDocument();
      expect(within(dialog).getByRole('list', { name: 'Active filters' })).toBeInTheDocument();
      expect(within(dialog).getByRole('option', { name: /Liver/ })).toBeInTheDocument();
      expect(within(dialog).getByRole('textbox', { name: 'Search' })).toBeInTheDocument();
      // jsdom reports no element as visible, so the dialog focuses its container instead of the search field.
      await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement));
      expect(expandedChange).toHaveBeenLastCalledWith(true);
    });

    it('adds and removes chips in the dialog', async () => {
      const user = userEvent.setup();
      const { selectedChange } = await setup({}, false);

      await user.click(screen.getByRole('button', { name: 'Organ' }));
      const dialog = await screen.findByRole('dialog', { name: 'Organ' });
      await user.click(within(dialog).getByRole('option', { name: /Liver/ }));

      expect(selectedChange).toHaveBeenLastCalledWith([liver]);

      await user.click(within(dialog).getByRole('button', { name: 'Remove Liver' }));

      expect(selectedChange).toHaveBeenLastCalledWith([]);
      expect(within(dialog).queryByRole('list', { name: 'Active filters' })).not.toBeInTheDocument();
    });

    it('scrolls the newest chip into view when an option is selected in the dialog', async () => {
      const user = userEvent.setup();
      const scrollIntoView = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoView;
      await setup({ selected: [kidney] }, false);

      await user.click(screen.getByRole('button', { name: 'Organ' }));
      const dialog = await screen.findByRole('dialog', { name: 'Organ' });
      await user.click(within(dialog).getByRole('option', { name: /Liver/ }));

      await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' }));
      expect(scrollIntoView.mock.contexts.at(-1)).toHaveTextContent('Liver');

      scrollIntoView.mockClear();
      await user.click(within(dialog).getByRole('option', { name: /Liver/ }));
      expect(scrollIntoView).not.toHaveBeenCalled();
      Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
    });

    it('closes the dialog with the Done button and returns focus to the label button', async () => {
      const user = userEvent.setup();
      const { expandedChange } = await setup({ doneLabel: 'Apply' }, false);

      const labelButton = screen.getByRole('button', { name: 'Organ' });
      await user.click(labelButton);
      const dialog = await screen.findByRole('dialog', { name: 'Organ' });
      await user.click(within(dialog).getByRole('button', { name: 'Apply' }));

      expect(expandedChange).toHaveBeenLastCalledWith(false);
      await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Organ' })).not.toBeInTheDocument());
      expect(labelButton).toHaveAttribute('aria-expanded', 'false');
      expect(labelButton).toHaveFocus();
    });

    it('closes the dialog with Escape', async () => {
      const user = userEvent.setup();
      const { expandedChange } = await setup({}, false);

      await user.click(screen.getByRole('button', { name: 'Organ' }));
      const dialog = await screen.findByRole('dialog', { name: 'Organ' });
      // The dialog checks the key code, which user-event doesn't set.
      fireEvent.keyDown(dialog, { key: 'Escape', keyCode: 27 });

      expect(expandedChange).toHaveBeenLastCalledWith(false);
      await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Organ' })).not.toBeInTheDocument());
    });

    it('closes the dialog when the viewport grows past the breakpoint', async () => {
      const user = userEvent.setup();
      const { breakpoint, fixture, expandedChange } = await setup({}, false);

      await user.click(screen.getByRole('button', { name: 'Organ' }));
      await screen.findByRole('dialog', { name: 'Organ' });
      breakpoint.next({ matches: true, breakpoints: {} });
      fixture.detectChanges();

      expect(expandedChange).toHaveBeenLastCalledWith(false);
      await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Organ' })).not.toBeInTheDocument());
    });

    it('opens the dialog when the filter starts expanded', async () => {
      await setup({ expanded: true }, false);

      expect(await screen.findByRole('dialog', { name: 'Organ' })).toBeInTheDocument();
    });
  });

  it('closes the search list panel when the viewport shrinks past the medium breakpoint', async () => {
    const user = userEvent.setup();
    const { breakpoint, fixture, expandedChange } = await setup();

    await user.click(screen.getByRole('button', { name: 'Organ' }));
    breakpoint.next({ matches: false, breakpoints: {} });
    fixture.detectChanges();

    expect(expandedChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole('dialog', { name: 'Organ' })).not.toBeInTheDocument();
  });
});
