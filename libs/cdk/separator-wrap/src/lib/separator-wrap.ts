import { Directive, effect, ElementRef, inject, input, Renderer2 } from '@angular/core';

/** Characters that {@link FriendlyWrap} breaks after by default: the separators of URLs, IRIs, IDs, and file names. */
export const DEFAULT_FRIENDLY_WRAP_CHARACTERS: readonly string[] = ['/', '.', '_', '-', ':', '?', '=', '&', '#'];

/**
 * Splits text at its line break opportunities: after each run of break symbols, except at the end of the text.
 * Consecutive symbols such as the `://` of a URL stay together.
 *
 * @param text Text to split.
 * @param characters Symbols to break after. A string is treated as a list of its characters; a list may hold
 * symbols longer than one character. Empty symbols are ignored.
 * @returns Consecutive segments that join back into the text. Empty text returns no segments.
 */
export function friendlyWrapSegments(
  text: string,
  characters: string | readonly string[] = DEFAULT_FRIENDLY_WRAP_CHARACTERS,
): string[] {
  const symbols = [...characters].filter((symbol) => symbol.length > 0).sort((a, b) => b.length - a.length);
  const segments: string[] = [];
  let start = 0;
  let index = 0;
  let inRun = false;

  while (index < text.length) {
    const symbol = symbols.find((candidate) => text.startsWith(candidate, index));
    if (symbol) {
      index += symbol.length;
      inRun = true;
    } else {
      if (inRun) {
        segments.push(text.slice(start, index));
        start = index;
        inRun = false;
      }
      index += 1;
    }
  }
  if (start < text.length) {
    segments.push(text.slice(start));
  }
  return segments;
}

/**
 * Renders text into its host element with a `<wbr>` after each run of break characters, so URLs, IRIs, IDs, and
 * file names wrap at readable points. The host's existing content is replaced.
 *
 * The content is built from text nodes, so the text is never parsed as HTML, and `<wbr>` adds no characters, so
 * copied text matches the original string. The directive adds no styles.
 *
 * @example
 * <span [angFriendlyWrap]="iri"></span>
 * <span [angFriendlyWrap]="path" angFriendlyWrapCharacters="/"></span>
 */
@Directive({
  selector: '[angFriendlyWrap]',
  host: { class: 'ang-friendly-wrap' },
})
export class FriendlyWrap {
  /** Text to render. */
  readonly text = input.required<string>({ alias: 'angFriendlyWrap' });

  /** Symbols to break after, as a string of characters or a list of symbols. See {@link friendlyWrapSegments}. */
  readonly characters = input<string | readonly string[]>(DEFAULT_FRIENDLY_WRAP_CHARACTERS, {
    alias: 'angFriendlyWrapCharacters',
  });

  /** Host element. */
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Renderer used to build the content. */
  readonly #renderer = inject(Renderer2);

  /** Rebuilds the host content when the text or characters change. */
  constructor() {
    effect(() => this.#render(friendlyWrapSegments(this.text(), this.characters())));
  }

  /**
   * Replaces the host content with the segments, separated by `<wbr>` elements.
   *
   * @param segments Segments to render.
   */
  #render(segments: readonly string[]): void {
    const renderer = this.#renderer;
    for (const child of Array.from(this.#host.childNodes)) {
      renderer.removeChild(this.#host, child);
    }

    segments.forEach((segment, index) => {
      if (index > 0) {
        renderer.appendChild(this.#host, renderer.createElement('wbr'));
      }
      renderer.appendChild(this.#host, renderer.createText(segment));
    });
  }
}
