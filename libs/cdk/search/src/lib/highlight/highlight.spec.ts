import { render, screen, waitFor } from '@testing-library/angular';
import { highlightSegments, SEARCH_HIGHLIGHT_NAME, SearchHighlight } from './highlight';
import { SearchRange } from '../engine/types';

describe('highlightSegments', () => {
  it('splits text into matched and unmatched segments', () => {
    expect(
      highlightSegments('Left Kidney', [
        [5, 8],
        [0, 2],
      ]),
    ).toEqual([
      { text: 'Le', match: true },
      { text: 'ft ', match: false },
      { text: 'Kid', match: true },
      { text: 'ney', match: false },
    ]);
  });

  it('clamps, merges, and drops ranges', () => {
    expect(
      highlightSegments('Heart', [
        [-2, 2],
        [1, 3],
        [4, 9],
        [3, 3],
      ]),
    ).toEqual([
      { text: 'Hea', match: true },
      { text: 'r', match: false },
      { text: 't', match: true },
    ]);
  });

  it('returns the whole text without ranges and nothing for empty text', () => {
    expect(highlightSegments('Heart')).toEqual([{ text: 'Heart', match: false }]);
    expect(highlightSegments('', [[0, 1]])).toEqual([]);
  });
});

describe('SearchHighlight', () => {
  async function setup(text: string, ranges?: readonly SearchRange[]) {
    return render(
      `<span data-testid="host" [angSearchHighlight]="text" [angSearchHighlightRanges]="ranges">stale</span>`,
      {
        imports: [SearchHighlight],
        componentProperties: { text, ranges },
      },
    );
  }

  it('wraps matches in mark elements', async () => {
    await setup('Left Kidney', [[5, 8]]);
    const host = screen.getByTestId('host');
    expect(host).toHaveClass('ang-search-highlight');
    expect(host).toHaveTextContent('Left Kidney');
    const mark = screen.getByText('Kid');
    expect(mark.tagName).toBe('MARK');
    expect(mark).toHaveClass('ang-search-highlight--match');
  });

  it('renders HTML in the text as plain text', async () => {
    await setup('<img src=x onerror=alert(1)> <b>bold</b>', [[0, 5]]);
    const host = screen.getByTestId('host');
    expect(host).toHaveTextContent('<img src=x onerror=alert(1)> <b>bold</b>');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('<img')).toHaveClass('ang-search-highlight--match');
  });

  it('rerenders when the inputs change', async () => {
    const { rerender } = await setup('Heart', [[0, 1]]);
    await rerender({ componentProperties: { text: 'Kidney', ranges: undefined } });
    const host = screen.getByTestId('host');
    expect(host).toHaveTextContent(/^Kidney$/);
    expect(screen.queryByText('H')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('mark')).toHaveLength(0);
  });

  it('highlights the matches of a term in the text', async () => {
    await render(`<span [angSearchHighlight]="'Left Kidney'" angSearchHighlightTerm="kid"></span>`, {
      imports: [SearchHighlight],
    });
    expect(screen.getByText('Kid').tagName).toBe('MARK');
  });

  it('clears the rendered text when the text is removed', async () => {
    const { rerender } = await setup('Heart', [[0, 1]]);
    await rerender({ componentProperties: { text: '', ranges: undefined } });
    expect(screen.getByTestId('host')).toBeEmptyDOMElement();
  });

  it('leaves the host content alone where custom highlights are unsupported', async () => {
    await render(`<span data-testid="host" angSearchHighlight angSearchHighlightTerm="kid">Left Kidney</span>`, {
      imports: [SearchHighlight],
    });
    expect(screen.getByTestId('host')).toHaveTextContent(/^Left Kidney$/);
    expect(screen.queryAllByRole('mark')).toHaveLength(0);
  });

  describe('with host content', () => {
    const template = `<span data-testid="host" [angSearchHighlight]="text" [angSearchHighlightTerm]="term" [angSearchHighlightRanges]="ranges">Left <b>{{ label }}</b></span>`;

    interface Properties {
      text?: string;
      term?: string;
      ranges?: readonly SearchRange[];
      label?: string;
    }

    function setupContent(componentProperties: Properties) {
      return render(template, {
        imports: [SearchHighlight],
        componentProperties: { label: 'Kidney', ...componentProperties },
      });
    }

    function highlighted(): string[] {
      return Array.from(CSS.highlights.get(SEARCH_HIGHLIGHT_NAME) ?? [], (range) => range.toString());
    }

    beforeEach(() => {
      vi.stubGlobal('CSS', { highlights: new Map() });
      vi.stubGlobal('Highlight', class extends Set {});
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('highlights the matches of a term without changing the content', async () => {
      await setupContent({ term: 'kid left' });
      expect(highlighted()).toEqual(['Left', 'Kid']);
      expect(screen.getByTestId('host')).toContainHTML('Left <b>Kidney</b>');
      expect(screen.queryAllByRole('mark')).toHaveLength(0);
    });

    it('highlights ranges of the text content, which take precedence over the term', async () => {
      await setupContent({ term: 'left', ranges: [[3, 8]] });
      expect(highlighted()).toEqual(['t Kid']);
    });

    it('follows changes of the inputs and the content', async () => {
      const { rerender } = await setupContent({ term: 'kid' });
      await rerender({ componentProperties: { term: 'ney', label: 'Kidney' } });
      await waitFor(() => expect(highlighted()).toEqual(['ney']));

      const [stale] = CSS.highlights.get(SEARCH_HIGHLIGHT_NAME) ?? [];
      await rerender({ componentProperties: { term: 'ney', label: 'Attorney' } });
      await waitFor(() => expect(CSS.highlights.get(SEARCH_HIGHLIGHT_NAME)?.has(stale)).toBe(false));
      expect(highlighted()).toEqual(['ney']);

      await rerender({ componentProperties: { term: 'heart', label: 'Attorney' } });
      await waitFor(() => expect(CSS.highlights.has(SEARCH_HIGHLIGHT_NAME)).toBe(false));
    });

    it('shares the highlight between hosts and removes its ranges when destroyed', async () => {
      const { fixture, rerender } = await render(
        `<span angSearchHighlight angSearchHighlightTerm="kid">Kidney</span>
        @if (shown) {
          <span angSearchHighlight angSearchHighlightTerm="left">Left</span>
        }`,
        { imports: [SearchHighlight], componentProperties: { shown: true } },
      );
      expect(highlighted().sort()).toEqual(['Kid', 'Left']);

      await rerender({ componentProperties: { shown: false } });
      expect(highlighted()).toEqual(['Kid']);
      fixture.destroy();
      expect(CSS.highlights.has(SEARCH_HIGHLIGHT_NAME)).toBe(false);
    });

    it('stops highlighting the content once a text is rendered', async () => {
      const { rerender } = await setupContent({ term: 'kid' });
      expect(highlighted()).toEqual(['Kid']);

      await rerender({ componentProperties: { term: 'kid', text: 'Kidney' } });
      await waitFor(() => expect(highlighted()).toEqual([]));
      expect(screen.getByText('Kid').tagName).toBe('MARK');
    });
  });
});
