import { createConfigurationToken, type } from '@atlasng/core';
import { TypeRef } from '@atlasng/content-templates/types';

/** Configures the content renderer. */
export interface ContentRendererConfig {
  /**
   * Error component used by boundaries whose definition declares none, and by the renderer root. Receives `node`,
   * `definition`, and `error` inputs when it declares them. Without one, a failed boundary renders nothing.
   */
  errorComponent?: TypeRef<unknown>;
}

/** Content renderer configuration, provided by `withRendererConfig`. */
export const CONTENT_RENDERER_CONFIG = createConfigurationToken({
  name: 'CONTENT_RENDERER_CONFIG',
  config: type<ContentRendererConfig>(),
  defaults: () => ({}),
});
