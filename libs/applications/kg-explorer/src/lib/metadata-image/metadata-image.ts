import { NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';

/** Renders a full-width image for a `MetadataImage` content node. */
@Component({
  selector: 'ang-kg-explorer-metadata-image',
  imports: [NgOptimizedImage],
  templateUrl: './metadata-image.html',
  styleUrl: './metadata-image.scss',
  host: { class: 'ang-kg-explorer-metadata-image' },
})
export class KgExplorerMetadataImage {
  /** Image source URL. */
  readonly src = input.required<string>();
  /** Alternative text describing the image. Use an empty string for decorative images. */
  readonly alt = input.required<string>();
}
