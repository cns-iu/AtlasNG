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

  /** Snackbar service */
  readonly #snackbar = inject(MatSnackBar);

  /**
   * Copys url to clipboard and shows a snackbar notification.
   */
  copyUrl(): void {
    navigator.clipboard.writeText(this.url());
    this.#snackbar.open('Link copied', '', {
      duration: 2000,
      panelClass: 'ang-link-snippet--copy-notification-panel',
      verticalPosition: 'top',
      politeness: 'polite',
    });
  }
}
