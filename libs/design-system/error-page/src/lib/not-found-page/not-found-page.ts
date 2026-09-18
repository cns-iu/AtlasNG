import { Component } from '@angular/core';
import { AnyLink } from '@atlasng/common';
import { ErrorPage, ErrorPageActions, ErrorPageDescription, ErrorPageTitle } from '../error-page';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'ang-not-found-page',
  imports: [ErrorPage, ErrorPageTitle, ErrorPageDescription, ErrorPageActions, MatButtonModule, AnyLink],
  templateUrl: './not-found-page.html',
  host: {
    class: 'ang-not-found-page',
  },
})
export class NotFoundPage {}
