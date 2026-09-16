import { Component, Directive, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AnyLink } from '@atlasng/common';

@Directive({
  selector: 'ang-not-found-page-title, [angNotFoundPageTitle]',
  host: {
    class: 'ang-not-found-page--title',
  },
})
export class NotFoundPageTitle {}

@Component({
  selector: 'ang-not-found-page',
  imports: [MatButtonModule, AnyLink],
  templateUrl: './not-found-page.html',
  styleUrl: './not-found-page.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ang-not-found-page',
  },
})
export class NotFoundPage {}
