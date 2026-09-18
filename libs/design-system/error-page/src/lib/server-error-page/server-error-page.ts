import { Component, input } from '@angular/core';
import { AnyLink, AnyLinkCommand } from '@atlasng/common';
import { ErrorPage, ErrorPageActions, ErrorPageDescription, ErrorPageTitle } from '../error-page';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'ang-server-error-page',
  imports: [ErrorPage, ErrorPageTitle, ErrorPageDescription, ErrorPageActions, MatButtonModule, AnyLink],
  templateUrl: './server-error-page.html',
  host: {
    class: 'ang-server-error-page',
  },
})
export class ServerErrorPage {
  /** Link for the report issue CTA */
  readonly reportIssueLink = input.required<AnyLinkCommand>();
}
