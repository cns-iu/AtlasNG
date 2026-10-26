import { TypeRef } from '@atlasng/content-blocks/types';
import { createConfigurationToken, type } from '@atlasng/core';

/** Configures content blocks. Passed to {@link provideContentBlocks}. */
export interface ContentBlocksConfig {
  /** Name of the data loader used for data given as a plain string, e.g. `http`. */
  defaultLoader?: string;
  /** Name of the data loader used for inline data, i.e. data values that are not a data source, e.g. `inline`. */
  defaultInlineLoader?: string;
  /** Name of the data parser applied to data sources that declare no `parser`, e.g. `json`. */
  defaultParser?: string;
  /**
   * Component rendering plain text nodes. Receives the text through a `text` input when it declares it. Without one,
   * text is rendered as a DOM text node.
   */
  textComponent?: TypeRef<unknown>;
  /**
   * Error component used by boundaries whose definition declares none. Receives `node`, `definition`, and `error`
   * inputs when it declares them. Without one, a failed boundary renders nothing.
   */
  errorComponent?: TypeRef<unknown>;
}

/** Content blocks configuration, provided by {@link provideContentBlocks}. */
export const CONTENT_BLOCKS_CONFIG = createConfigurationToken({
  name: 'CONTENT_BLOCKS_CONFIG',
  config: type<ContentBlocksConfig>(),
  defaults: () => ({
    defaultLoader: 'http',
    defaultInlineLoader: 'inline',
    defaultParser: 'passthrough',
  }),
});
