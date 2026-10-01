import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Visual and semantic tone of a notice. */
export type NoticeVariant = 'info' | 'success' | 'warning' | 'critical' | 'unavailable';

/** Material icon shown for each notice variant. */
const VARIANT_ICONS: Record<NoticeVariant, string> = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  critical: 'dangerous',
  unavailable: 'warning',
};

/** Default screen-reader text that conveys each variant's tone. */
const VARIANT_LABELS: Record<NoticeVariant, string> = {
  info: 'Info',
  success: 'Success',
  warning: 'Warning',
  critical: 'Critical',
  unavailable: 'Unavailable',
};

/**
 * Static message box that highlights information within page content.
 *
 * Each variant pairs a color treatment with an icon, and a visually hidden label
 * conveys the variant to screen readers. The notice does not announce itself, so it
 * suits content that is present when the page loads rather than feedback to an action.
 */
@Component({
  selector: 'ang-notice',
  imports: [MatIconModule],
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

  /** Optional title shown above the body. Rendered as text rather than a document heading. */
  readonly heading = input<string>();

  /** Screen-reader text read before the content. Defaults to a label for the variant. */
  readonly variantLabel = input<string>();

  /** Material icon name for the current variant. */
  protected readonly icon = computed(() => VARIANT_ICONS[this.variant()]);

  /** Screen-reader label for the current variant. */
  protected readonly resolvedVariantLabel = computed(() => this.variantLabel() ?? VARIANT_LABELS[this.variant()]);
}
