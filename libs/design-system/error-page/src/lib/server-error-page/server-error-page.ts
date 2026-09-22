import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AnyLink, AnyLinkCommand } from '@atlasng/common';
import { ErrorPage, ErrorPageAction, ErrorPageDescription, ErrorPageTitle } from '../error-page';

/**
 * A component that displays a 500 Server Error page.
 */
@Component({
  selector: 'ang-server-error-page',
  imports: [ErrorPage, ErrorPageTitle, ErrorPageDescription, ErrorPageAction, MatButtonModule, AnyLink],
  templateUrl: './server-error-page.html',
})
export class ServerErrorPage {
  /** Link for the report issue CTA */
  readonly reportIssueLink = input.required<AnyLinkCommand>();
}
