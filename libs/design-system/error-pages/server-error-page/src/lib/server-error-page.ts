import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { AnyLink } from '@atlasng/common';

@Component({
  selector: 'ang-server-error-page',
  imports: [MatButtonModule, RouterModule, AnyLink],
  templateUrl: './server-error-page.html',
  styleUrl: './server-error-page.scss',
})
export class ServerErrorPage {
  /** Link for the report issue CTA */
  readonly reportIssueLink = input.required<string>();
}
