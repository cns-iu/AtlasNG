import { TypeRef } from '@atlasng/content-templates/types';
import { createConfigurationToken, type } from '@atlasng/core';

/** Configures content templates. Passed to {@link provideContentTemplates}. */
export interface ContentTemplatesConfig {
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

/** Content templates configuration, provided by {@link provideContentTemplates}. */
export const CONTENT_TEMPLATES_CONFIG = createConfigurationToken({
  name: 'CONTENT_TEMPLATES_CONFIG',
  config: type<ContentTemplatesConfig>(),
  defaults: () => ({
    defaultLoader: 'http',
    defaultInlineLoader: 'inline',
    defaultParser: 'passthrough',
  }),
});
