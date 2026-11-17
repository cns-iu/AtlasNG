import { render, screen } from '@testing-library/angular';
import { FriendlyWrap, friendlyWrapSegments } from './friendly-wrap';

describe('friendlyWrapSegments', () => {
  it('splits after each run of the default characters', () => {
    expect(friendlyWrapSegments('https://example.com/a_b-c:d?e=f&g#h')).toEqual([
      'https://',
      'example.',
      'com/',
      'a_',
      'b-',
      'c:',
      'd?',
      'e=',
      'f&',
      'g#',
      'h',
    ]);
  });

  it('splits after custom characters and symbols', () => {
    expect(friendlyWrapSegments('a/b.c', '.')).toEqual(['a/b.', 'c']);
    expect(friendlyWrapSegments('fish and chips', ['and'])).toEqual(['fish and', ' chips']);
  });

  it('keeps plain words whole and ignores empty symbols', () => {
    expect(friendlyWrapSegments('kidney')).toEqual(['kidney']);
    expect(friendlyWrapSegments('a/b', '')).toEqual(['a/b']);
    expect(friendlyWrapSegments('a/b', [''])).toEqual(['a/b']);
  });

  it('does not split at the ends of the text', () => {
    expect(friendlyWrapSegments('/path/')).toEqual(['/', 'path/']);
    expect(friendlyWrapSegments('')).toEqual([]);
  });
});

describe('FriendlyWrap', () => {
  async function setup(text: string, characters?: string | readonly string[]) {
    const binding = characters === undefined ? '' : '[angFriendlyWrapCharacters]="characters"';
    return render(`<span data-testid="host" [angFriendlyWrap]="text" ${binding}>stale</span>`, {
      imports: [FriendlyWrap],
      componentProperties: { text, characters },
    });
  }

  function nodes(host: HTMLElement): string[] {
    return Array.from(host.childNodes, (node) =>
      node instanceof Text ? node.data : `<${node.nodeName.toLowerCase()}>`,
    );
  }

  it('adds break opportunities after the default characters', async () => {
    await setup('https://example.com/path');
    const host = screen.getByTestId('host');
    expect(host).toHaveClass('ang-friendly-wrap');
    expect(nodes(host)).toEqual(['https://', '<wbr>', 'example.', '<wbr>', 'com/', '<wbr>', 'path']);
  });

  it('adds break opportunities after custom characters', async () => {
    await setup('a/b.c', '.');
    expect(nodes(screen.getByTestId('host'))).toEqual(['a/b.', '<wbr>', 'c']);
  });

  it('leaves plain words unbroken', async () => {
    await setup('kidney');
    expect(nodes(screen.getByTestId('host'))).toEqual(['kidney']);
  });

  it('keeps the text content equal to the input', async () => {
    const text = 'https://purl.humanatlas.io/asct-b/kidney#ASCTB-TEMP_cortex-of-kidney';
    await setup(text);
    const host = screen.getByTestId('host');
    expect(host.textContent).toBe(text);
    expect(host).toHaveTextContent(text);
  });

  it('renders HTML in the text as plain text', async () => {
    await setup('<img src=x onerror=alert(1)>/<b>bold</b>', '/');
    const host = screen.getByTestId('host');
    expect(host.textContent).toBe('<img src=x onerror=alert(1)>/<b>bold</b>');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(Array.from(host.children, (child) => child.tagName)).toEqual(['WBR', 'WBR']);
  });

  it('rerenders when the inputs change', async () => {
    const { rerender } = await setup('a/b', '/');
    await rerender({ componentProperties: { text: 'c.d', characters: '.' } });
    expect(nodes(screen.getByTestId('host'))).toEqual(['c.', '<wbr>', 'd']);
  });
});
