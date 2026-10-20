import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  Directive,
  input,
  output,
  TemplateRef,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { MatButton } from '@angular/material/button';

/** Counter used to generate unique rich tooltip ids. */
let nextId = 0;

/**
 * Title of a custom rich tooltip. Projected into the tagline row of the {@link RichTooltip} panel.
 */
@Component({
  selector: 'ang-rich-tooltip-tagline',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RichTooltipTagline {}

/**
 * Supporting text of a custom rich tooltip. Projected into the content row of the {@link RichTooltip} panel.
 */
@Component({
  selector: 'ang-rich-tooltip-content',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
 * Supply `tagline`, `description` and `actionText` for the simple variant, or project
 * {@link RichTooltipTagline}, {@link RichTooltipContent} and {@link RichTooltipAction} elements
 * for custom content. The panel renders nothing in place; triggers attach its template to an overlay.
 * A single panel can be shared by several triggers.
 */
@Component({
  selector: 'ang-rich-tooltip',
  imports: [MatButton],
  templateUrl: './rich-tooltip.html',
  styleUrl: './rich-tooltip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'angRichTooltip',
})
export class RichTooltip {
  /** Title of the simple variant. Ignored when a {@link RichTooltipTagline} is projected. */
  readonly tagline = input<string>();

  /** Supporting text of the simple variant. Ignored when a {@link RichTooltipContent} is projected. */
  readonly description = input<string>();

  /** Label of the simple variant's action button. The button is only shown when this is set. */
  readonly actionText = input<string>();

  /** Emits when the simple variant's action button is clicked. */
  readonly actionClick = output<void>();

  /** Emits when the panel requests to be closed, e.g. by a {@link RichTooltipClose} button. */
  readonly closed = output<void>();

  /** Unique id of the panel element, referenced by the trigger's `aria-controls`. */
  readonly id = `ang-rich-tooltip-${nextId++}`;

  /** Id of the tagline row, referenced by the panel's `aria-labelledby`. */
  protected readonly taglineId = `${this.id}-tagline`;

  /** Template with the panel content, attached to an overlay by the trigger. */
  readonly templateRef = viewChild.required(TemplateRef);

  /** Projected custom tagline, if any. */
  private readonly customTagline = contentChild(RichTooltipTagline);

  /** Projected custom content, if any. */
  private readonly customContent = contentChild(RichTooltipContent);

  /** Projected custom actions. */
  private readonly customActions = contentChildren(RichTooltipAction);

  /** Whether the tagline row is rendered. */
  protected readonly hasTagline = computed(() => !!this.customTagline() || !!this.tagline());

  /** Whether the content row is rendered. */
  protected readonly hasContent = computed(() => !!this.customContent() || !!this.description());

  /** Whether the actions row is rendered. */
  protected readonly hasActions = computed(() => this.customActions().length > 0 || !!this.actionText());

  /** Requests every trigger that currently shows this panel to close it. */
  close(): void {
    this.closed.emit();
  }
}
