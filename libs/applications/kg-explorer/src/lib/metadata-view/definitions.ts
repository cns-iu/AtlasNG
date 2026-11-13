import { ContentDefinition } from '@atlasng/content-blocks/types';
import { passthroughSchema } from '@atlasng/content-blocks/utils';
import { KgExplorerMetadataChips } from '../metadata-chips/metadata-chips';
import { KgExplorerMetadataImage } from '../metadata-image/metadata-image';
import { KgExplorerMetadataModel } from '../metadata-model/metadata-model';
import { KgExplorerMetadataTable } from '../metadata-table/metadata-table';

/**
 * `MetadataImage`: a full-width image.
 *
 * Config: `src` and `alt`. Use an empty `alt` for decorative images.
 */
const KG_EXPLORER_METADATA_IMAGE_DEFINITION = {
  name: 'MetadataImage',
  component: KgExplorerMetadataImage,
  config: {
    src: passthroughSchema<string>(),
    alt: passthroughSchema<string>(),
  },
} satisfies ContentDefinition;

/**
 * `MetadataChips`: a group of non-interactive chips, for example tags.
 *
 * Config: `labels`, in display order.
 */
const KG_EXPLORER_METADATA_CHIPS_DEFINITION = {
  name: 'MetadataChips',
  component: KgExplorerMetadataChips,
  config: {
    labels: passthroughSchema<string[]>(),
  },
} satisfies ContentDefinition;

/**
 * `MetadataModel`: an interactive 3D model, for example a GLB file, that users can rotate and zoom.
 *
 * Config: `src` and `alt`.
 */
const KG_EXPLORER_METADATA_MODEL_DEFINITION = {
  name: 'MetadataModel',
  component: KgExplorerMetadataModel,
  config: {
    src: passthroughSchema<string>(),
    alt: passthroughSchema<string>(),
  },
} satisfies ContentDefinition;

/**
 * `MetadataTable`: a sortable table loaded from a CSV file.
 *
 * Config: `url` of the CSV file.
 */
const KG_EXPLORER_METADATA_TABLE_DEFINITION = {
  name: 'MetadataTable',
  component: KgExplorerMetadataTable,
  config: {
    url: passthroughSchema<string>(),
  },
} satisfies ContentDefinition;

/** Every metadata page definition. The page registers them together with the design-system definitions. */
export const KG_EXPLORER_METADATA_DEFINITIONS: ContentDefinition[] = [
  KG_EXPLORER_METADATA_IMAGE_DEFINITION,
  KG_EXPLORER_METADATA_CHIPS_DEFINITION,
  KG_EXPLORER_METADATA_MODEL_DEFINITION,
  KG_EXPLORER_METADATA_TABLE_DEFINITION,
];
