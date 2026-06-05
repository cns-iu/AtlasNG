import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AnyLinkCommand } from '@atlasng/common';
import { SocialMediaButton } from '@atlasng/design-system/buttons/social-media';
import { TextLink } from '@atlasng/design-system/text-link';

@Component({
  selector: 'ang-footer',
  imports: [MatButtonModule, MatIconModule, SocialMediaButton, TextLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  readonly socials = input<string[]>();
  readonly logoUrl = input<string>();
  readonly orgName = input<string>();
  readonly email = input<string>();
  readonly orgLink = input<AnyLinkCommand>();
  readonly fullYear = new Date().getFullYear();
}
