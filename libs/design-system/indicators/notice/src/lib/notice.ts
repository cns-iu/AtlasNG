import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Heading } from '@atlasng/design-system/content/heading';

/** Visual and semantic tone of a notice. */
export type NoticeVariant = 'info' | 'success' | 'warning' | 'critical' | 'unavailable';

/** Icon shown for a notice variant and the label that names it for screen readers. */
interface NoticeVariantConfig {
  /** Material icon name. */
  readonly icon: string;
  /** Accessible name of the icon. */
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
 * Each variant pairs a color treatment with an icon whose accessible name conveys the
 * variant to screen readers. The notice does not announce itself, so it suits content
 * that is present when the page loads rather than feedback to an action.
 */
@Component({
  selector: 'ang-notice',
  imports: [Heading, MatIconModule],
  templateUrl: './notice.html',
  styleUrl: './notice.scss',
  host: {
    class: 'ang-notice',
    '[class]': '"ang-notice--variant-" + variant()',
  },
})
export class Notice {
  /** Tone of the notice, which sets its colors, icon, and screen-reader label. */
  readonly variant = input<NoticeVariant>('info');

  /** Optional title shown above the body. Rendered as text unless `level` is set. */
  readonly tagline = input<string>();

  /**
   * Optional heading level for the tagline. When set, the tagline renders as a native heading
   * so it appears in the document outline; use one level below the surrounding section.
   */
  readonly level = input<number | string>();

  /** Icon and screen-reader label for the current variant. */
  protected readonly config = computed(() => VARIANT_CONFIGS[this.variant()]);
}
