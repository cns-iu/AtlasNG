import { Component } from '@angular/core';

/**
 * Renders projected content as a body paragraph.
 *
 * The paragraph's font is scaled according to a size-multiplier configurable via tokens.
 */
@Component({
  selector: 'ang-content-paragraph',
  templateUrl: './content-paragraph.html',
  styleUrl: './content-paragraph.scss',
  host: { class: 'ang-content-paragraph' },
})
export class ContentParagraph {}
