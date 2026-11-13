import { Component, computed, DOCUMENT, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Button that allows users to skip directly to the main content of the page,
 * improving accessibility and user experience for keyboard and assistive technology users.
 * The button becomes visible when focused and is hidden off-screen otherwise.
 * When activated, it moves focus to the element whose ID is {@link SkipToContentButton.anchorId}
 * and scrolls it into view, without leaving the current route.
 */
@Component({
  selector: 'ang-skip-to-content-button',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './skip-to-content-button.html',
  styleUrl: './skip-to-content-button.scss',
})
export class SkipToContentButton {
  /** The ID of the anchor element to skip to. */
  readonly anchorId = input.required<string>();

  /** The label for the button. */
  readonly label = input('Skip to main content');

  /** Fragment link to the target, shown on hover and used when the link is copied. */
  protected readonly href = computed(() => `#${this.anchorId()}`);

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
  protected skipToContent(event: Event): void {
    event.preventDefault();
    const target = this.#document.getElementById(this.anchorId());
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
