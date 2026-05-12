import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { SocialMediaId } from './types/social-media.schema';
import { SOCIAL_IDS, SOCIALS } from './static-data/parsed';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * Component for rendering a social media button based on the provided social media id.
 * The button displays the corresponding icon and links to the associated social media page.
 */
@Component({
  selector: 'ang-social-media-button',
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './social-media-button.html',
  styleUrl: './social-media-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialMediaButton {
  /** Registry for managing SVG icons */
  readonly iconRegistry = inject(MatIconRegistry);

  /** Sanitizer for handling security-related operations */
  readonly sanitizer = inject(DomSanitizer);

  /** Social media to display */
  readonly id = input.required<SocialMediaId>();

  /** Social media button data */
  protected readonly data = computed(() => SOCIALS.find(({ id }) => id === this.id()));

  constructor() {
    this.registerIcons();
  }

  /**
   * Registers social icons
   */
  private registerIcons(): void {
    SOCIAL_IDS.forEach((id) => {
      this.iconRegistry.addSvgIconInNamespace(
        'social',
        id,
        this.sanitizer.bypassSecurityTrustResourceUrl(`assets/icons/social/${id}.svg`),
      );
    });
  }
}
