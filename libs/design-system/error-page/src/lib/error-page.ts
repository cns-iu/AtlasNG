import { Component, Directive, ViewEncapsulation } from '@angular/core';

/** Marks projected content as the error page title. Works as an element or an attribute. */
@Directive({
  selector: 'ang-error-page-title, [angErrorPageTitle]',
  host: { class: 'ang-error-page--title-content' },
})
export class ErrorPageTitle {}

/** Marks projected content as the description that informs the user about the error. Works as an element or an attribute. */
@Directive({
  selector: 'ang-error-page-description, [angErrorPageDescription]',
  host: { class: 'ang-error-page--description-content' },
})
export class ErrorPageDescription {}

/** Marks projected content as an error page action. Works as an element or an attribute. */
@Directive({
  selector: 'ang-error-page-action, [angErrorPageAction]',
  host: { class: 'ang-error-page--action' },
})
export class ErrorPageAction {}

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
