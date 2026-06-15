import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AnyLink } from '@atlasng/common';
import { HeaderShellNavigationItem } from '../header-shell';

@Component({
  selector: 'ang-navigation-menu',
  imports: [MatIconModule, MatSidenavModule, MatButtonModule, MatExpansionModule, AnyLink],
  templateUrl: './navigation-menu.html',
  styleUrl: './navigation-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationMenu {
  readonly navigationItems = input<HeaderShellNavigationItem[]>([]);
}
