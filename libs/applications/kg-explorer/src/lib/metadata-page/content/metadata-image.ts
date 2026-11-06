import { Component, input } from '@angular/core';

/** Renders a full-width image for a `MetadataImage` content node. */
@Component({
  selector: 'ang-metadata-image',
  template: '<img class="ang-metadata-image--image" [attr.src]="src()" [attr.alt]="alt()" />',
  styleUrl: './metadata-image.scss',
  host: { class: 'ang-metadata-image' },
})
export class MetadataImage {
  /** Image source URL. */
  readonly src = input.required<string>();
  /** Alternative text describing the image. Use an empty string for decorative images. */
  readonly alt = input.required<string>();
}
