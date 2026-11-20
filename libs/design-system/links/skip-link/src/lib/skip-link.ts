import { Component, computed, DOCUMENT, inject, input, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { provideEventScope, TrackClick } from '@atlasng/analytics';
import { SkipLinkTargetRegistry } from './skip-link-target';

/**
 * Link that lets keyboard and assistive technology users skip straight to the page's main content.
 * It is hidden until it receives focus.
 *
 * The link goes to the element whose id is {@link SkipLink.anchorId} or, without one, to the page's
 * {@link SkipLinkTarget}. Activating it moves focus to that element and scrolls it into view,
 * without leaving the current route. With neither, the link is disabled.
 */
@Component({
  selector: 'ang-skip-link',
  imports: [MatButtonModule, MatIconModule, TrackClick],
  templateUrl: './skip-link.html',
  styleUrl: './skip-link.scss',
  providers: [provideEventScope('skip-link')],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ang-skip-link',
  },
})
export class SkipLink {
  /** Id of the element to skip to. Takes precedence over the page's {@link SkipLinkTarget}. */
  readonly anchorId = input<string>();

  /** Label for the link. */
  readonly label = input('Skip to main content');

  /** Id of the element the link goes to, or `undefined` when there is none. */
  protected readonly targetId = computed(() => this.anchorId() || this.#targets.first()?.id);

  /** Fragment link to the target, shown on hover and used when the link is copied. */
  protected readonly href = computed(() => {
    const id = this.targetId();
    return id ? `#${id}` : null;
  });

  /** Whether the link is disabled because it has no target. */
  protected readonly disabled = computed(() => !this.targetId());

  /** Targets marked with {@link SkipLinkTarget}. */
  readonly #targets = inject(SkipLinkTargetRegistry);

  /** Document used to look up the target element. */
  readonly #document = inject(DOCUMENT);

  /**
   * Moves focus to the target and scrolls it into view.
   *
   * The default navigation is prevented because a fragment `href` resolves against `<base href>`,
   * which would leave the current route on any page but the root. A target that can't receive
   * focus gets `tabindex="-1"`, so focus can move to it without adding it to the tab order.
   *
   * @param event Click event from the link.
   */
  protected skip(event: Event): void {
    event.preventDefault();
    const id = this.targetId();
    const target = id ? this.#document.getElementById(id) : null;
    if (!target) {
      return;
    }

    if (!target.hasAttribute('tabindex') && target.tabIndex < 0) {
      target.setAttribute('tabindex', '-1');
    }

    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'start' });
  }
}
