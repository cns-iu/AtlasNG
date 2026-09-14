import { Component, inject, input, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

/** Displays a link in a code-snippet-style presentation with related actions. */
@Component({
  selector: 'ang-link-snippet',
  imports: [MatIconModule, MatButtonModule],
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

  /** Snackbar service */
  private readonly snackbar = inject(MatSnackBar);

  /**
   * Copys url to clipboard and shows a snackbar notification.
   */
  copyUrl(): void {
    navigator.clipboard.writeText(this.url());
    this.snackbar.open('Link copied', '', {
      duration: 2000,
      panelClass: 'copy-snackbar',
      verticalPosition: 'top',
    });
  }
}
