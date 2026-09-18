import { Component, Directive, ViewEncapsulation } from '@angular/core';

/** Title for the error page */
@Directive({
  selector: 'ang-error-page-title, [angErrorPageTitle]',
})
export class ErrorPageTitle {}

/** Informs user about the error */
@Directive({
  selector: 'ang-error-page-description, [angErrorPageDescription]',
})
export class ErrorPageDescription {}

/** Actions for the error page */
@Directive({
  selector: 'ang-error-page-actions, [angErrorPageActions]',
})
export class ErrorPageActions {}

/**
 * A component that displays a customizable error page.
 */
@Component({
  selector: 'ang-error-page',
  templateUrl: './error-page.html',
  styleUrl: './error-page.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ang-error-page',
  },
})
export class ErrorPage {}
