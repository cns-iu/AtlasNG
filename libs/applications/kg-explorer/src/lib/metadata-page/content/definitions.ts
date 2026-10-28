import { ContentDefinition } from '@atlasng/content-blocks/types';
import { passthroughSchema } from '@atlasng/content-blocks/utils';
import { MetadataChips } from './metadata-chips';
import { MetadataImage } from './metadata-image';

/**
 * `MetadataImage`: a full-width image.
 *
 * Config: `src` and `alt`. Use an empty `alt` for decorative images.
 */
export const METADATA_IMAGE_DEFINITION = {
  name: 'MetadataImage',
  component: MetadataImage,
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
export const METADATA_CHIPS_DEFINITION = {
  name: 'MetadataChips',
  component: MetadataChips,
  config: {
    labels: passthroughSchema<string[]>(),
  },
} satisfies ContentDefinition;

/** Every metadata page definition. The page registers them together with the design-system definitions. */
export const METADATA_PAGE_DEFINITIONS: ContentDefinition[] = [METADATA_IMAGE_DEFINITION, METADATA_CHIPS_DEFINITION];
