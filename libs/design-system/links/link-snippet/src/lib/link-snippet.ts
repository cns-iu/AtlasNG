import { Component, computed, inject, input, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AnyLink, IdGenerator } from '@atlasng/common';

/** Regular expression to match URL prefixes. */
const URL_PREFIX_REGEX = /^(https?:\/\/)?(www\.)?/i;

/** Displays a link in a code-snippet-style presentation with related actions. */
@Component({
  selector: 'ang-link-snippet',
  imports: [AnyLink, MatIconModule, MatButtonModule],
  templateUrl: './link-snippet.html',
  styleUrl: './link-snippet.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ang-link-snippet',
  },
})
export class LinkSnippet {
  /** Url to display */
  readonly url = input.required<string>();

  /** Label for the url with the URL prefix removed */
  protected readonly urlLabel = computed(() => this.url().replace(URL_PREFIX_REGEX, ''));

  /** ID for the url label */
  protected readonly labelId = inject(IdGenerator).getId('ang-link-snippet--label');

  /** ID for the hint announcing that the link opens in a new tab */
  protected readonly newTabHintId = inject(IdGenerator).getId('ang-link-snippet--new-tab-hint');

  /** Snackbar service */
  readonly #snackbar = inject(MatSnackBar);

  /**
   * Copies the URL to the clipboard and shows a snackbar notification.
   * The notification reports a failure when the clipboard write is rejected,
   * for example because of missing permissions or an insecure context.
   * @returns Promise that resolves once the clipboard write has settled and the notification is shown
   */
  async copyUrl(): Promise<void> {
    let message = 'Link copied';
    try {
      await navigator.clipboard.writeText(this.url());
    } catch {
      message = 'Could not copy link';
    }

    this.#snackbar.open(message, '', {
      duration: 2000,
      panelClass: 'ang-link-snippet--copy-notification-panel',
      verticalPosition: 'top',
      politeness: 'polite',
    });
  }
}
