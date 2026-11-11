import { afterRenderEffect, DestroyRef, Directive, effect, ElementRef, inject, input, Renderer2 } from '@angular/core';
import { SearchRange } from '../engine/types';
import { findMatchRanges } from '../text/match-ranges';
import { mergeRanges } from '../text/ranges';
import { createTextRanges } from './text-ranges';

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
 * Name of the CSS custom highlight that {@link SearchHighlight} registers for matches in its host's own content.
 * Style it with `::highlight(ang-search-highlight)`.
 */
export const SEARCH_HIGHLIGHT_NAME = 'ang-search-highlight';

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
 * Highlights the matches of a search in its host element, in one of two modes:
 *
 * - With a text (`[angSearchHighlight]="text"`), the text is rendered into the host with the matches wrapped in
 *   `<mark class="ang-search-highlight--match">`. The host's existing content is replaced. The content is built from
 *   text nodes, so the text is never parsed as HTML.
 * - Without a text (`angSearchHighlight`), the matches in the host's own content are added to the
 *   {@link SEARCH_HIGHLIGHT_NAME} CSS custom highlight. The content is not modified, so it may contain elements and
 *   bindings, and the matches are restyled with `::highlight(ang-search-highlight)`. Nothing is highlighted where the
 *   CSS Custom Highlight API is unavailable, such as on the server.
 *
 * Matches are given as ranges, e.g. from `SearchMatch.ranges`, or found from a search term.
 *
 * @example
 * <span [angSearchHighlight]="match.value" [angSearchHighlightRanges]="match.ranges"></span>
 * <span angSearchHighlight [angSearchHighlightTerm]="term()">{{ label }} <em>{{ note }}</em></span>
 */
@Directive({
  selector: '[angSearchHighlight]',
  host: { class: 'ang-search-highlight' },
})
export class SearchHighlight {
  /** Text to render. When empty or omitted, the host's own content is highlighted instead. */
  readonly text = input<string | undefined>(undefined, { alias: 'angSearchHighlight' });

  /**
   * Half-open `[start, end)` ranges to highlight, as offsets into the text or into the host's text content. Takes
   * precedence over the term.
   */
  readonly ranges = input<readonly SearchRange[] | undefined>(undefined, { alias: 'angSearchHighlightRanges' });

  /** Search term whose words are highlighted wherever they occur, ignoring case and accents. */
  readonly term = input<string | undefined>(undefined, { alias: 'angSearchHighlightTerm' });

  /** Host element. */
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Renderer used to build the content. */
  readonly #renderer = inject(Renderer2);

  /** Whether the host content was rendered from the text. */
  #rendered = false;

  /** DOM ranges this directive added to the custom highlight. */
  #highlighted: Range[] = [];

  /** Observes the host's own content while it is highlighted. */
  #observer?: MutationObserver;

  /** Rebuilds the host content or its highlights when the inputs change. */
  constructor() {
    effect(() => {
      const text = this.text();
      if (text) {
        this.#render(highlightSegments(text, this.#matchRanges(text)));
        this.#rendered = true;
      } else if (this.#rendered) {
        this.#render([]);
        this.#rendered = false;
      }
    });

    afterRenderEffect(() => {
      // Read the inputs so the highlights follow them
      const content = !this.text();
      this.ranges();
      this.term();
      this.#observe(content);
      this.#highlightContent(content);
    });

    inject(DestroyRef).onDestroy(() => {
      this.#observe(false);
      this.#highlightContent(false);
    });
  }

  /**
   * Resolves the ranges to highlight in a text: the ranges input, or else the matches of the term.
   *
   * @param text Text the ranges index into.
   * @returns Ranges to highlight.
   */
  #matchRanges(text: string): readonly SearchRange[] {
    return this.ranges() ?? findMatchRanges(text, this.term() ?? '');
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

  /**
   * Starts or stops observing the host's content, so that its highlights follow changes made by bindings.
   *
   * @param enabled Whether the host's own content is highlighted.
   */
  #observe(enabled: boolean): void {
    if (!enabled) {
      this.#observer?.disconnect();
      this.#observer = undefined;
    } else if (!this.#observer && typeof MutationObserver !== 'undefined') {
      this.#observer = new MutationObserver(() => this.#highlightContent(true));
      this.#observer.observe(this.#host, { characterData: true, childList: true, subtree: true });
    }
  }

  /**
   * Replaces the ranges this directive contributes to the custom highlight. The highlight is shared by every
   * directive, created when first needed, and unregistered once it is empty.
   *
   * @param enabled Whether the host's own content is highlighted.
   */
  #highlightContent(enabled: boolean): void {
    if (typeof CSS === 'undefined' || typeof Highlight === 'undefined' || !CSS.highlights) {
      return;
    }

    const registry = CSS.highlights;
    let highlight = registry.get(SEARCH_HIGHLIGHT_NAME);
    for (const range of this.#highlighted) {
      highlight?.delete(range);
    }
    this.#highlighted = enabled ? createTextRanges(this.#host, (text) => this.#matchRanges(text)) : [];

    if (this.#highlighted.length > 0 && !highlight) {
      highlight = new Highlight();
      registry.set(SEARCH_HIGHLIGHT_NAME, highlight);
    }
    for (const range of this.#highlighted) {
      highlight?.add(range);
    }
    if (highlight?.size === 0) {
      registry.delete(SEARCH_HIGHLIGHT_NAME);
    }
  }
}
