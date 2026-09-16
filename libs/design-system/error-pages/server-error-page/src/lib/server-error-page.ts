import { Component, Directive, input, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AnyLink, AnyLinkCommand } from '@atlasng/common';

@Directive({
  selector: 'ang-server-error-page-title, [angServerErrorPageTitle]',
  host: {
    class: 'ang-server-error-page--title',
  },
})
export class ServerErrorPageTitle {}

@Component({
  selector: 'ang-server-error-page',
  imports: [MatButtonModule, AnyLink],
  templateUrl: './server-error-page.html',
  styleUrl: './server-error-page.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ang-server-error-page',
  },
})
export class ServerErrorPage {
  /** Link for the report issue CTA */
  readonly reportIssueLink = input.required<AnyLinkCommand>();
}
