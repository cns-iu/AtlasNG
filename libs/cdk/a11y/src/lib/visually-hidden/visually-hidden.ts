import { ChangeDetectionStrategy, Component, Directive, inject, ViewEncapsulation } from '@angular/core';
import { StyleLoader } from '@atlasng/cdk';

/**
 * Style-only component that adds the global `cdk-visually-hidden` class rules once per application.
 * Loaded by {@link VisuallyHidden} through the {@link StyleLoader}.
 */
@Component({
  selector: 'ang-visually-hidden-styles',
  template: '',
  styleUrl: './visually-hidden.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class VisuallyHiddenStyles {}

/**
 * Hides an element visually while keeping it available to screen readers.
 *
 * Adds the Angular CDK `cdk-visually-hidden` class and loads its styles, so components no longer need to include the
 * `cdk.a11y-visually-hidden` Sass mixin themselves. The rules match the ones the Angular CDK and Material load
 * internally, so loading both does not conflict.
 *
 * @example
 * ```html
 * <span angVisuallyHidden>Opens in a new tab</span>
 * ```
 */
@Directive({
  selector: '[angVisuallyHidden]',
  host: {
    class: 'cdk-visually-hidden',
  },
})
export class VisuallyHidden {
  /** Loads the visually hidden styles. */
  constructor() {
    inject(StyleLoader).load(VisuallyHiddenStyles);
  }
}
