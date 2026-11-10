import { provideSearch, SearchEngine, SearchIndex, withCustomEngine, withSearchConfig } from '@atlasng/cdk/search';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { SearchField } from './search-field';

interface Organ {
  name: string;
}

const ORGANS = ['Heart', 'Kidney', 'Large Intestine', 'Liver', 'Lung', 'Lymph Node', 'Pâncreas', 'Spleen'];

/** An engine that only suggests values starting with the term. */
class StartsWithEngine implements SearchEngine {
  createIndex<T>(items: readonly T[]): SearchIndex<T> {
    const values = items.map(String);
    return {
      search: ({ term }) =>
        items.flatMap((item, index) =>
          values[index].toLowerCase().startsWith(term.toLowerCase())
            ? [{ item, matches: [{ field: 'value', value: values[index], ranges: [[0, term.length] as const] }] }]
            : [],
        ),
      suggest: (term) =>
        values
          .filter((value) => value.toLowerCase().startsWith(term.toLowerCase()))
          .map((value) => ({ value, ranges: [[0, term.length] as const] })),
    };
  }
}

describe('SearchField', () => {
  function setup(inputs: Record<string, unknown> = {}, providers: unknown[] = []) {
    return render(SearchField, {
      inputs: { items: ORGANS, ...inputs },
      componentProviders: providers as never[],
    });
  }

  function getInput(name = 'Search'): HTMLInputElement {
    return screen.getByRole('combobox', { name });
  }

  it('renders a labelled search input with a placeholder', async () => {
    await setup({ label: 'Find organs', placeholder: 'Type an organ' });

    expect(getInput('Find organs')).toHaveAttribute('placeholder', 'Type an organ');
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('suggests matching items and highlights the match', async () => {
    const user = userEvent.setup();
    await setup();

    await user.type(getInput(), 'ne');

    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent?.trim())).toEqual(['Kidney', 'Large Intestine']);
    const marks = options.map((option) => within(option).getByText((_, element) => element?.tagName === 'MARK'));
    expect(marks.map((mark) => mark.textContent)).toEqual(['ne', 'ne']);
    expect(marks[0]).toHaveClass('ang-search-highlight--match');
  });

  it('ignores accents when suggesting and highlighting', async () => {
    const user = userEvent.setup();
    await setup();

    await user.type(getInput(), 'panc');

    const option = await screen.findByRole('option', { name: 'Pâncreas' });
    expect(within(option).getByText('Pânc')).toHaveClass('ang-search-highlight--match');
  });

  it('suggests values of the suggestion field', async () => {
    const user = userEvent.setup();
    await setup({ items: ORGANS.map((name): Organ => ({ name })), suggestionField: 'name' });

    await user.type(getInput(), 'sple');

    expect(await screen.findByRole('option', { name: 'Spleen' })).toBeInTheDocument();
  });

  it('shows explicit suggestions as they are', async () => {
    const user = userEvent.setup();
    await setup({ suggestions: ['Remote lung', 'Remote liver'] });

    await user.type(getInput(), 'he');

    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent?.trim())).toEqual(['Remote lung', 'Remote liver']);
  });

  it('highlights explicit suggestions with ranges', async () => {
    const user = userEvent.setup();
    await setup({ suggestions: [{ value: 'Remote lung', ranges: [[7, 9]] }, 'Remote liver'] });

    await user.type(getInput(), 'lu');

    const options = await screen.findAllByRole('option');
    expect(within(options[0]).getByText('lu')).toHaveClass('ang-search-highlight--match');
    expect(within(options[1]).queryByText((_, element) => element?.tagName === 'MARK')).not.toBeInTheDocument();
  });

  it('updates the value and emits the selected suggestion', async () => {
    const user = userEvent.setup();
    const suggestionSelected = vi.fn();
    const { fixture } = await setup({}, []);
    fixture.componentInstance.suggestionSelected.subscribe(suggestionSelected);

    await user.type(getInput(), 'kid');
    await user.click(await screen.findByRole('option', { name: 'Kidney' }));

    expect(getInput()).toHaveValue('Kidney');
    expect(fixture.componentInstance.value()).toBe('Kidney');
    expect(suggestionSelected).toHaveBeenCalledWith('Kidney');
  });

  it('selects suggestions with the keyboard', async () => {
    const user = userEvent.setup();
    await setup();

    await user.type(getInput(), 'lun');
    await screen.findByRole('option', { name: 'Lung' });
    // Material reads the deprecated keyCode, which user-event does not set
    await fireEvent.keyDown(getInput(), { key: 'ArrowDown', keyCode: 40 });
    await fireEvent.keyDown(getInput(), { key: 'Enter', keyCode: 13 });

    expect(getInput()).toHaveValue('Lung');
  });

  it('clears the value from the clear button and refocuses the input', async () => {
    const user = userEvent.setup();
    const cleared = vi.fn();
    const { fixture } = await setup({ value: 'Heart' });
    fixture.componentInstance.cleared.subscribe(cleared);

    await user.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(getInput()).toHaveValue('');
    expect(getInput()).toHaveFocus();
    expect(cleared).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('clears the value and closes the suggestions on Escape', async () => {
    const user = userEvent.setup();
    const cleared = vi.fn();
    const { fixture } = await setup();
    fixture.componentInstance.cleared.subscribe(cleared);

    await user.type(getInput(), 'lu');
    await screen.findByRole('option', { name: 'Lung' });
    await user.keyboard('{Escape}');

    expect(getInput()).toHaveValue('');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    expect(cleared).toHaveBeenCalledTimes(1);

    await user.keyboard('{Escape}');
    expect(cleared).toHaveBeenCalledTimes(1);
  });

  it('disables the input and hides the clear button', async () => {
    await setup({ disabled: true, value: 'Heart' });

    expect(getInput()).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('debounces suggestions', async () => {
    const user = userEvent.setup();
    await setup({ debounce: 50 });

    await user.type(getInput(), 'hea');

    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    expect(await screen.findByRole('option', { name: 'Heart' })).toBeInTheDocument();
  });

  it('uses the configured debounce by default', async () => {
    const user = userEvent.setup();
    await setup({}, [provideSearch(withSearchConfig({ debounce: 50 }))]);

    await user.type(getInput(), 'hea');

    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('option', { name: 'Heart' })).toBeInTheDocument());
  });

  it('uses a custom engine provided to the component', async () => {
    const user = userEvent.setup();
    await setup({}, [provideSearch(withCustomEngine(() => new StartsWithEngine()))]);

    await user.type(getInput(), 'l');

    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent?.trim())).toEqual([
      'Large Intestine',
      'Liver',
      'Lung',
      'Lymph Node',
    ]);
    expect(within(options[0]).getByText('L')).toHaveClass('ang-search-highlight--match');
  });
});
