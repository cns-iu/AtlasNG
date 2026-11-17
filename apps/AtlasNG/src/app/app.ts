import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SHOWCASE_PAGES } from './app.routes';

/**
 * Application shell: links to the showcase pages and renders the active one.
 */
@Component({
  selector: 'ang-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  /** Showcase pages listed in the navigation. */
  protected readonly pages = SHOWCASE_PAGES;
}
