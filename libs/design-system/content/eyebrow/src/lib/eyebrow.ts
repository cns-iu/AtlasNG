import { Component } from '@angular/core';

/**
 * Renders projected content as an eyebrow, the short uppercase label above a heading.
 *
 * The eyebrow adds no semantics of its own. Use the `ang-eyebrow` element, or add the `angEyebrow` attribute to the
 * element whose semantics fit, such as a heading or a `span` inside one.
 * The text is uppercased with CSS, so write it in sentence case and screen readers read words instead of letters.
 * The color defaults to the theme's `primary` role and can be changed with the `color` token.
 */
@Component({
  selector: 'ang-eyebrow, [angEyebrow]',
  templateUrl: './eyebrow.html',
  styleUrl: './eyebrow.scss',
  host: { class: 'ang-eyebrow' },
})
export class Eyebrow {}
