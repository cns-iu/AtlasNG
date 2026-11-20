import { InteractivityChecker } from '@angular/cdk/a11y';
import {
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  HostAttributeToken,
  inject,
  Service,
  signal,
} from '@angular/core';
import { IdGenerator } from '@atlasng/common';

/**
 * Bit that `compareDocumentPosition` sets when the other node comes before the reference node.
 * Spelled out because the `Node` global doesn't exist during server-side rendering.
 */
const DOCUMENT_POSITION_PRECEDING = 2;

/**
 * Keeps track of the {@link SkipLinkTarget} elements on the page, so {@link SkipLink} can link to one
 * without an explicit id.
 */
@Service()
export class SkipLinkTargetRegistry {
  /** Registered targets, in registration order. */
  readonly #targets = signal<SkipLinkTarget[]>([]);

  /**
   * The registered target whose element comes first in the document, or `undefined` when none is registered.
   * Document order is read when a target registers or unregisters, not when elements move.
   */
  readonly first = computed(() =>
    this.#targets().reduce<SkipLinkTarget | undefined>(
      (first, target) =>
        !first || first.element.compareDocumentPosition(target.element) & DOCUMENT_POSITION_PRECEDING ? target : first,
      undefined,
    ),
  );

  /**
   * Registers a target.
   *
   * @param target Target to register.
   * @returns A function that unregisters the target.
   */
  register(target: SkipLinkTarget): () => void {
    this.#targets.update((targets) => [...targets, target]);
    return () => this.#targets.update((targets) => targets.filter((item) => item !== target));
  }
}

/**
 * Marks the element that {@link SkipLink} moves focus to, typically the page's `<main>`.
 *
 * An element without an `id` gets a generated one. An element that can't receive focus and has no
 * `tabindex` gets `tabindex="-1"`, so focus can move to it without adding it to the tab order.
 * When several targets are on the page, the skip link goes to the one that comes first in the document.
 * Set `id` and `tabindex` as static attributes; bound values aren't read.
 */
@Directive({
  selector: '[angSkipLinkTarget]',
  host: {
    '[attr.id]': 'id',
    '[attr.tabindex]': 'tabIndex',
  },
})
export class SkipLinkTarget {
  /** Host element that receives focus. */
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** The host's `id` attribute, or a generated id when it has none. */
  readonly id =
    inject(new HostAttributeToken('id'), { optional: true }) || inject(IdGenerator).getId('ang-skip-link-target');

  /** The host's `tabindex` attribute, or `-1` when the host can't receive focus without one. */
  protected readonly tabIndex =
    inject(new HostAttributeToken('tabindex'), { optional: true }) ??
    (inject(InteractivityChecker).isFocusable(this.element, { ignoreVisibility: true }) ? null : -1);

  /** Registers the target for as long as it exists. */
  constructor() {
    inject(DestroyRef).onDestroy(inject(SkipLinkTargetRegistry).register(this));
  }
}
