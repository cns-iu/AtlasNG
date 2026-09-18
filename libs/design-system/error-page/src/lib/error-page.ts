import { Component, Directive, ViewEncapsulation } from '@angular/core';

@Directive({
  selector: 'ang-error-page-title, [angErrorPageTitle]',
  host: {
    class: 'ang-error-page--title',
  },
})
export class ErrorPageTitle {}

@Directive({
  selector: 'ang-error-page-description, [angErrorPageDescription]',
  host: {
    class: 'ang-error-page--description',
  },
})
export class ErrorPageDescription {}

@Directive({
  selector: 'ang-error-page-actions, [angErrorPageActions]',
  host: {
    class: 'ang-error-page--actions',
  },
})
export class ErrorPageActions {}

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
