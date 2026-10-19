import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Visual and semantic tone of a notice. */
export type NoticeVariant = 'info' | 'success' | 'warning' | 'critical' | 'unavailable';

/** Icon shown for a notice variant and the label that names it for screen readers. */
interface NoticeVariantConfig {
  /** Material icon name. */
  readonly icon: string;
  /** Visually hidden text that announces the variant to screen readers. */
  readonly label: string;
}

/** Icon and screen-reader label for each notice variant. */
const VARIANT_CONFIGS: Record<NoticeVariant, NoticeVariantConfig> = {
  info: { icon: 'info', label: 'Info' },
  success: { icon: 'check_circle', label: 'Success' },
  warning: { icon: 'warning', label: 'Warning' },
  critical: { icon: 'dangerous', label: 'Critical' },
  unavailable: { icon: 'warning', label: 'Unavailable' },
};

/**
 * Static message box that highlights information within page content.
 *
 * Each variant pairs a color treatment with a decorative icon, and a visually hidden
 * variant name (for example "Warning:") precedes the tagline or body so screen readers
 * convey the tone without relying on color. The host has the ARIA `note` role. The notice
 * does not announce itself, so it suits content that is present when the page loads rather
 * than feedback to an action.
 */
@Component({
  selector: 'ang-notice',
  imports: [MatIconModule],
  templateUrl: './notice.html',
  styleUrl: './notice.scss',
  host: {
    class: 'ang-notice',
    role: 'note',
    '[class]': '"ang-notice--variant-" + variant()',
  },
})
export class Notice {
  /** Tone of the notice, which sets its colors, icon, and screen-reader label. */
  readonly variant = input<NoticeVariant>('info');

  /** Optional title shown above the body. */
  readonly tagline = input<string>();

  /** Icon and screen-reader label for the current variant. */
  protected readonly config = computed(() => VARIANT_CONFIGS[this.variant()]);
}
