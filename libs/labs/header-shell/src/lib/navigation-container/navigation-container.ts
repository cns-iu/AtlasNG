import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { NavigationMenu } from '../navigation-menu/navigation-menu';
import { HeaderShellNavigationItem } from '../header-shell';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ang-navigation-container',
  imports: [CommonModule, MatSidenavModule, NavigationMenu],
  templateUrl: './navigation-container.html',
  styleUrl: './navigation-container.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationContainer {
  readonly navigationItems = input<HeaderShellNavigationItem[]>();
  readonly navRight = input<HeaderShellNavigationItem[]>();
  readonly email = input<string>();
  readonly socialMediaIds = input(['linkedin', 'youtube', 'github', 'bluesky', 'instagram', 'facebook', 'x']);

  readonly leftMenuOpen = model(false);
  readonly rightMenuOpen = model(false);

  appsMenuToggle() {
    this.rightMenuOpen.set(!this.rightMenuOpen());
    this.leftMenuOpen.set(false);
  }

  localNavigationToggle() {
    this.leftMenuOpen.set(!this.leftMenuOpen());
    this.rightMenuOpen.set(false);
  }
}
