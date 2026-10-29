import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AnyLink } from '@atlasng/common';
import { ErrorPage, ErrorPageAction, ErrorPageDescription, ErrorPageTitle } from '../error-page';

/**
 * A component that displays a 404 Not Found page.
 */
@Component({
  selector: 'ang-not-found-page',
  imports: [ErrorPage, ErrorPageTitle, ErrorPageDescription, ErrorPageAction, MatButtonModule, AnyLink],
  templateUrl: './not-found-page.html',
  styleUrl: './not-found-page.scss',
})
export class NotFoundPage {}
