import { render, screen } from '@testing-library/angular';
import { highlightSegments, SearchHighlight } from './highlight';
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
});
