import { Directive, effect, ElementRef, inject, input, Renderer2 } from '@angular/core';
import { mergeRanges } from './normalize';
import { SearchRange } from './types';

/** A run of text that either matched a search term or did not. */
export interface HighlightSegment {
  /** Segment text. */
  readonly text: string;
  /** Whether the segment is part of a match. */
  readonly match: boolean;
}

/** Class of the `<mark>` elements rendered by {@link SearchHighlight}. */
export const SEARCH_HIGHLIGHT_MATCH_CLASS = 'ang-search-highlight--match';

/**
 * Splits text into matched and unmatched segments. Ranges are clamped to the text and may be unsorted or overlap.
 *
 * @param text Text to split.
 * @param ranges Half-open `[start, end)` ranges of the matches, e.g. from `SearchMatch.ranges`.
 * @returns Consecutive segments that join back into the text. Empty text returns no segments.
 */
export function highlightSegments(text: string, ranges: readonly SearchRange[] = []): HighlightSegment[] {
  const clamped = ranges.map(([start, end]): SearchRange => [Math.max(0, start), Math.min(text.length, end)]);
  const segments: HighlightSegment[] = [];
  let offset = 0;

  for (const [start, end] of mergeRanges(clamped)) {
    if (start > offset) {
      segments.push({ text: text.slice(offset, start), match: false });
    }
    segments.push({ text: text.slice(start, end), match: true });
    offset = end;
  }
  if (offset < text.length) {
    segments.push({ text: text.slice(offset), match: false });
  }
  return segments;
}

/**
 * Renders text into its host element with the matched ranges wrapped in
 * `<mark class="ang-search-highlight--match">`. The host's existing content is replaced.
 *
 * The content is built from text nodes, so the text is never parsed as HTML.
 *
 * @example
 * <span [angSearchHighlight]="match.value" [angSearchHighlightRanges]="match.ranges"></span>
 */
@Directive({
  selector: '[angSearchHighlight]',
  host: { class: 'ang-search-highlight' },
})
export class SearchHighlight {
  /** Text to render. */
  readonly text = input.required<string>({ alias: 'angSearchHighlight' });

  /** Half-open `[start, end)` ranges of `text` to highlight. */
  readonly ranges = input<readonly SearchRange[] | undefined>(undefined, { alias: 'angSearchHighlightRanges' });

  /** Host element. */
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Renderer used to build the content. */
  readonly #renderer = inject(Renderer2);

  /** Rebuilds the host content when the text or ranges change. */
  constructor() {
    effect(() => this.#render(highlightSegments(this.text(), this.ranges())));
  }

  /**
   * Replaces the host content with the segments.
   *
   * @param segments Segments to render.
   */
  #render(segments: readonly HighlightSegment[]): void {
    const renderer = this.#renderer;
    for (const child of Array.from(this.#host.childNodes)) {
      renderer.removeChild(this.#host, child);
    }

    for (const segment of segments) {
      const text = renderer.createText(segment.text);
      if (segment.match) {
        const mark = renderer.createElement('mark');
        renderer.addClass(mark, SEARCH_HIGHLIGHT_MATCH_CLASS);
        renderer.appendChild(mark, text);
        renderer.appendChild(this.#host, mark);
      } else {
        renderer.appendChild(this.#host, text);
      }
    }
  }
}
