import {
  Component,
  computed,
  contentChild,
  contentChildren,
  Directive,
  inject,
  input,
  output,
  TemplateRef,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { provideEventScope, TrackClick } from '@atlasng/analytics';
import { IdGenerator } from '@atlasng/common';

/**
 * Title of a custom rich tooltip. Projected into the tagline row of the {@link RichTooltip} panel.
 */
@Directive({
  selector: 'ang-rich-tooltip-tagline, [angRichTooltipTagline]',
  host: { class: 'ang-rich-tooltip--tagline' },
})
export class RichTooltipTagline {}

/**
 * Supporting text of a custom rich tooltip. Projected into the content row of the {@link RichTooltip} panel.
 */
@Directive({
  selector: 'ang-rich-tooltip-content, [angRichTooltipContent]',
  host: { class: 'ang-rich-tooltip--content' },
})
export class RichTooltipContent {}

/**
 * Marks an element, usually a `matButton`, as an action of a custom rich tooltip.
 * Every action is collected into the actions row of the {@link RichTooltip} panel.
 * Combine with {@link RichTooltipClose} to also close the tooltip when the action is clicked.
 */
@Directive({
  selector: 'ang-rich-tooltip-action, [angRichTooltipAction]',
  host: { class: 'ang-rich-tooltip--action' },
})
export class RichTooltipAction {}

/**
 * Panel of a persistent rich tooltip, opened by a {@link RichTooltipTrigger}.
 *
 * Supply `tagline`, `description` and `actionLabel` for the simple variant, or project
 * {@link RichTooltipTagline}, {@link RichTooltipContent} and {@link RichTooltipAction} elements
 * for custom content. The panel renders nothing in place; triggers attach its template to an overlay.
 * A single panel can be shared by several triggers.
 */
@Component({
  selector: 'ang-rich-tooltip',
  imports: [MatButton, TrackClick],
  templateUrl: './rich-tooltip.html',
  styleUrl: './rich-tooltip.scss',
  providers: [provideEventScope('rich-tooltip')],
  encapsulation: ViewEncapsulation.None,
  host: {
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
    '[attr.aria-describedby]': 'null',
  },
  exportAs: 'angRichTooltip',
})
export class RichTooltip {
  /** Title of the simple variant. Ignored when a {@link RichTooltipTagline} is projected. */
  readonly tagline = input<string>();

  /** Supporting text of the simple variant. Ignored when a {@link RichTooltipContent} is projected. */
  readonly description = input<string>();

  /** Label of the simple variant's action button. The button is only shown when this is set. */
  readonly actionLabel = input<string>();

  /** Accessible name of the panel. Use when the panel has no tagline. */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  /** Space-separated ids of elements labelling the panel. Defaults to the tagline row. */
  readonly ariaLabelledby = input<string | null>(null, { alias: 'aria-labelledby' });

  /** Space-separated ids of elements describing the panel. Defaults to the content row. */
  readonly ariaDescribedby = input<string | null>(null, { alias: 'aria-describedby' });

  /** Emits when the simple variant's action button is clicked. */
  readonly actionClick = output<void>();

  /** Emits when the panel requests to be closed, e.g. by a {@link RichTooltipClose} button. */
  readonly closed = output<void>();

  /** Template with the panel content, attached to an overlay by the trigger. */
  readonly templateRef = viewChild.required(TemplateRef);

  /** Unique id of the panel element, referenced by the trigger's `aria-controls`. */
  readonly id = inject(IdGenerator).getId('ang-rich-tooltip');

  /** Id of the tagline row, referenced by the panel's `aria-labelledby`. */
  protected readonly taglineId = inject(IdGenerator).getId('ang-rich-tooltip--tagline');

  /** Id of the content row, referenced by the panel's `aria-describedby`. */
  protected readonly contentId = inject(IdGenerator).getId('ang-rich-tooltip--content');

  /** Projected custom tagline, if any. */
  protected readonly customTagline = contentChild(RichTooltipTagline);

  /** Projected custom content, if any. */
  protected readonly customContent = contentChild(RichTooltipContent);

  /** Projected custom actions. */
  protected readonly customActions = contentChildren(RichTooltipAction);

  /** Whether the panel renders a tagline row. */
  protected readonly hasTagline = computed(() => !!(this.customTagline() || this.tagline()));

  /** Whether the panel renders a content row. */
  protected readonly hasContent = computed(() => !!(this.customContent() || this.description()));

  /** Ids labelling the panel: the consumer's ids, else the tagline row unless an `aria-label` is set. */
  protected readonly labelledby = computed(
    () => this.ariaLabelledby() ?? (this.hasTagline() && !this.ariaLabel() ? this.taglineId : null),
  );

  /** Ids describing the panel: the consumer's ids, else the content row. */
  protected readonly describedby = computed(
    () => this.ariaDescribedby() ?? (this.hasContent() ? this.contentId : null),
  );

  /** Requests every trigger that currently shows this panel to close it. */
  close(): void {
    this.closed.emit();
  }
}
