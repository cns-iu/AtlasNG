import { Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import '@google/model-viewer';

/**
 * Renders an interactive 3D model, such as a GLB file, for a `MetadataModel` content node.
 *
 * The model is displayed with the `model-viewer` web component from `@google/model-viewer`, which users can rotate
 * and zoom.
 */
@Component({
  selector: 'ang-kg-explorer-metadata-model',
  templateUrl: './metadata-model.html',
  styleUrl: './metadata-model.scss',
  host: { class: 'ang-kg-explorer-metadata-model' },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class KgExplorerMetadataModel {
  /** Model source URL, for example a GLB file. */
  readonly src = input.required<string>();
  /** Alternative text describing the model. */
  readonly alt = input.required<string>();
}
