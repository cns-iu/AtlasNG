import { Component } from '@angular/core';

/**
 * Renders projected content as an overline, the short uppercase label above a heading.
 *
 * The overline adds no semantics of its own. Use the `ang-overline` element, or add the `angOverline` attribute to the
 * element whose semantics fit, such as a heading or a `span` inside one.
 * The text is uppercased with CSS, so write it in sentence case and screen readers read words instead of letters.
 * The color defaults to the theme's `primary` role and can be changed with the `color` token.
 */
@Component({
  selector: 'ang-overline, [angOverline]',
  template: '<ng-content />',
  styleUrl: './overline.scss',
  host: { class: 'ang-overline' },
})
export class Overline {}
