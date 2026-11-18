import { PLATFORM_ID } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { SeparatorWrap, separatorWrapSegments } from './separator-wrap';

describe('separatorWrapSegments', () => {
  it('splits after each run of the default characters', () => {
    expect(separatorWrapSegments('https://example.com/a_b-c:d?e=f&g#h')).toEqual([
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
    expect(separatorWrapSegments('a/b.c', '.')).toEqual(['a/b.', 'c']);
    expect(separatorWrapSegments('fish and chips', ['and'])).toEqual(['fish and', ' chips']);
  });

  it('matches symbols literally, across line breaks', () => {
    expect(separatorWrapSegments('a(b)|c', ['(', ')|'])).toEqual(['a(', 'b)|', 'c']);
    expect(separatorWrapSegments('a/\nb/c', '/')).toEqual(['a/', '\nb/', 'c']);
  });

  it('keeps plain words whole and ignores empty symbols', () => {
    expect(separatorWrapSegments('kidney')).toEqual(['kidney']);
    expect(separatorWrapSegments('a/b', '')).toEqual(['a/b']);
    expect(separatorWrapSegments('a/b', [''])).toEqual(['a/b']);
  });

  it('does not split at the ends of the text', () => {
    expect(separatorWrapSegments('/path/')).toEqual(['/', 'path/']);
    expect(separatorWrapSegments('')).toEqual([]);
  });
});

describe('SeparatorWrap', () => {
  async function setup(
    text: string,
    characters?: string | readonly string[],
    { platform = 'browser', content = 'stale' }: { platform?: string; content?: string } = {},
  ) {
    const binding = characters === undefined ? '' : '[angSeparatorWrapCharacters]="characters"';
    return render(`<span data-testid="host" [angSeparatorWrap]="text" ${binding}>${content}</span>`, {
      imports: [SeparatorWrap],
      componentProperties: { text, characters },
      providers: [{ provide: PLATFORM_ID, useValue: platform }],
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
    expect(host).toHaveClass('ang-separator-wrap');
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

  it('keeps template content on the server', async () => {
    await setup('a/b', '/', { platform: 'server' });
    expect(nodes(screen.getByTestId('host'))).toEqual(['stale']);
  });

  it('renders into an empty host on the server', async () => {
    await setup('a/b', '/', { platform: 'server', content: '' });
    expect(nodes(screen.getByTestId('host'))).toEqual(['a/', '<wbr>', 'b']);
  });
});
