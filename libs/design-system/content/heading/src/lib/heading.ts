import { NgTemplateOutlet } from '@angular/common';
import { Component, input, numberAttribute } from '@angular/core';

/** Valid native HTML heading levels. */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Coerces an input value to a valid native HTML heading level.
 *
 * @param value - Value supplied to the heading's level input.
 * @returns The corresponding heading level from 1 through 6.
 * @throws When the value is not an integer from 1 through 6 in development mode.
 */
export function headingLevelAttribute(value: number | string): HeadingLevel {
  const level = numberAttribute(value);

  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    if (!Number.isInteger(level) || level < 1 || level > 6) {
      throw new Error(`Invalid heading level: ${value}. Level must be an integer between 1 and 6.`);
    }
  }

  return Math.max(1, Math.min(6, level | 0)) as HeadingLevel;
}

/**
 * Renders text or projected content as the native heading element selected by `level`.
 */
@Component({
  selector: 'ang-heading',
  imports: [NgTemplateOutlet],
  templateUrl: './heading.html',
  styleUrl: './heading.scss',
  host: { class: 'ang-heading' },
})
export class Heading {
  /** Native heading level used to select the rendered `h1` through `h6` element. */
  readonly level = input.required({ transform: headingLevelAttribute });

  /** Optional ID applied to the rendered heading element. */
  readonly id = input<string>();

  /** Fallback text displayed when no content is projected into the component. */
  readonly tagline = input<string>();
}
