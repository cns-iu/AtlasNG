import { createTextRanges } from './text-ranges';

function element(html: string): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = html;
  return root;
}

function texts(ranges: readonly Range[]): string[] {
  return ranges.map((range) => range.toString());
}

describe('createTextRanges', () => {
  it('maps offsets in the text content onto text nodes', () => {
    const root = element('Left <b>Kid</b>ney');
    const getRanges = vi.fn(() => [[5, 11]] as const);
    const [range] = createTextRanges(root, getRanges);

    expect(getRanges).toHaveBeenCalledWith('Left Kidney');
    expect(range.toString()).toBe('Kidney');
    expect(range.startContainer.textContent).toBe('Kid');
    expect(range.endContainer.textContent).toBe('ney');
    expect(range.endOffset).toBe(3);
  });

  it('keeps ranges that end at a node boundary inside that node', () => {
    const [range] = createTextRanges(element('<i>Left</i> Kidney'), () => [[0, 4]]);
    expect(range.endContainer.textContent).toBe('Left');
    expect(range.endOffset).toBe(4);
  });

  it('clamps, merges, and sorts ranges', () => {
    const root = element('Heart<span>wood</span>');
    const ranges = createTextRanges(root, () => [
      [7, 40],
      [-3, 2],
      [1, 3],
      [4, 4],
    ]);
    expect(texts(ranges)).toEqual(['Hea', 'od']);
  });

  it('returns no ranges for an element without text', () => {
    expect(createTextRanges(element('<br>'), () => [[0, 3]])).toEqual([]);
  });
});
