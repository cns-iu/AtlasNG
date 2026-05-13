import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SOCIALS } from './static-data/parsed';

/**
 * Component for rendering a social media button based on the provided social media id.
 * The button displays the corresponding icon and links to the associated social media page.
 */
@Component({
  selector: 'ang-social-media-button',
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './social-media-button.html',
  styleUrl: './social-media-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialMediaButton {
  /** Social media to display */
  readonly id = input.required<string>();

  /** Social media button data */
  protected readonly data = computed(() => SOCIALS.find(({ id }) => id === this.id()));

  /**
   * Returns icon url for the given social media id.
   * @param icon - Social media id to get the icon for
   * @returns URL string for the social media icon
   */
  imageUrl(icon: string): string {
    return `url(assets/icons/social/${icon}.svg)`;
  }
}
