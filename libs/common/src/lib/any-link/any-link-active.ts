import { computed, contentChildren, Directive, effect, inject, input, output, Signal } from '@angular/core';
import type { IsActiveMatchOptions } from '@angular/router';
import { LinkHandler, PreparedLink } from '../links/handler';
import { AnyLink } from './any-link';

/** CSS classes accepted by {@link AnyLinkActive}. */
export type AnyLinkActiveClassList = string | string[] | null | undefined;

/** Route-matching configuration accepted by {@link AnyLinkActive}. */
export type AnyLinkActiveOptions = { exact: boolean } | Partial<IsActiveMatchOptions> | null | undefined;

/** Values supported by the WAI-ARIA `aria-current` attribute. */
export type AriaCurrent = 'page' | 'step' | 'location' | 'date' | 'time' | true | false;

/** Match options used when exact matching is requested. */
const EXACT_MATCH_OPTIONS: IsActiveMatchOptions = {
  paths: 'exact',
  queryParams: 'exact',
  fragment: 'ignored',
  matrixParams: 'ignored',
};

/** Default match options used for subset route matching. */
const SUBSET_MATCH_OPTIONS: IsActiveMatchOptions = {
  paths: 'subset',
  queryParams: 'subset',
  fragment: 'ignored',
  matrixParams: 'ignored',
};

/**
 * Normalizes a space-delimited string or array of CSS classes.
 *
 * Empty and whitespace-only entries are removed.
 *
 * @param classes Class input to normalize.
 * @returns Individual non-empty CSS class names.
 */
export function classListAttribute(classes: AnyLinkActiveClassList): string[] {
  if (!classes) {
    return [];
  }

  const result: string[] = [];
  const list = Array.isArray(classes) ? classes : classes.split(' ');
  for (const item of list) {
    const trimmed = item.trim();
    if (trimmed) {
      result.push(trimmed);
    }
  }

  return result;
}

/**
 * Applies classes and optional `aria-current` metadata when an associated
 * {@link AnyLink} is active.
 *
 * The directive can share a host with one link or be placed on an ancestor to
 * monitor any number of descendant links.
 */
@Directive({
  selector: '[angAnyLinkActive]',
  host: {
    '[class]': 'this.isActive() ? this.classes() : null',
    '[attr.aria-current]': 'this.isActive() ? this.ariaCurrentWhenActive()?.toString() : null',
  },
  exportAs: 'angAnyLinkActive',
})
export class AnyLinkActive {
  /** CSS classes applied to the host while at least one associated link is active. */
  readonly classes = input([], { alias: 'angAnyLinkActive', transform: classListAttribute });

  /** Route-matching behavior, or `null` to disable active-state matching. */
  readonly options = input<AnyLinkActiveOptions>(undefined, { alias: 'angAnyLinkActiveOptions' });

  /** Value assigned to `aria-current` while active. */
  readonly ariaCurrentWhenActive = input<AriaCurrent>();

  /** Emits an initially active state and every subsequent active-state change. */
  readonly isActiveChange = output<boolean>();

  /** Whether the host link or at least one descendant link is currently active. */
  readonly isActive = computed(() => {
    if (this.options() === null) {
      return false;
    }

    return this.#activeSignals().some((signal) => signal());
  });

  /** Descendant links monitored when this directive is placed on an ancestor. */
  protected readonly links = contentChildren(AnyLink, { descendants: true });

  /** Link on the same host element, when present. */
  readonly #link = inject(AnyLink, { optional: true });

  /** Strategy used to evaluate prepared links against the current location. */
  readonly #handler = inject<LinkHandler<PreparedLink>>(LinkHandler);

  /** Resolved router match options derived from the public options input. */
  readonly #matchOptions = computed(() => {
    const options = this.options();
    if (!options) {
      return SUBSET_MATCH_OPTIONS;
    } else if ('exact' in options) {
      return options.exact ? EXACT_MATCH_OPTIONS : SUBSET_MATCH_OPTIONS;
    }

    return options;
  });

  /** Per-options cache that prevents duplicate active signals for a prepared link. */
  readonly #activeSignalCache = computed(() => {
    // Clear the cache when match options change
    this.#matchOptions();
    return new WeakMap<PreparedLink, Signal<boolean>>();
  });

  /** Active-state signals for every prepared link associated with this directive. */
  readonly #activeSignals = computed(() => {
    const result: Signal<boolean>[] = [];
    for (const link of this.#preparedLinks()) {
      result.push(this.#getActiveSignal(link));
    }

    return result;
  });

  /** Watches the aggregate active state and emits changes to consumers. */
  constructor() {
    let isFirstChange = true;
    effect(() => {
      const active = this.isActive();
      if (!isFirstChange || active) {
        this.isActiveChange.emit(active);
      }

      isFirstChange = false;
    });
  }

  /**
   * Gets or creates the active-state signal for a prepared link.
   *
   * @param link Prepared link to evaluate.
   * @returns Cached active-state signal for the current match options.
   */
  #getActiveSignal(link: PreparedLink): Signal<boolean> {
    const matchOptions = this.#matchOptions();
    const cache = this.#activeSignalCache();
    let signal = cache.get(link);

    if (!signal) {
      signal = this.#handler.isActive(link, matchOptions);
      cache.set(link, signal);
    }

    return signal;
  }

  /**
   * Iterates over prepared links on the same host and beneath an ancestor host.
   *
   * Links without a prepared navigation command are omitted.
   *
   * @returns Prepared links associated with this directive.
   */
  *#preparedLinks(): Iterable<PreparedLink> {
    if (this.#link) {
      const preparedLink = this.#link.preparedLink();
      if (preparedLink) {
        yield preparedLink;
      }
    }

    for (const link of this.links()) {
      const preparedLink = link.preparedLink();
      if (preparedLink) {
        yield preparedLink;
      }
    }
  }
}
