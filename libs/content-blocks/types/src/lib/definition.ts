import { Type } from '@angular/core';
import { ContentConfigSchema } from './config-schema';
import { ContentDataSchema } from './data-schema';
import { ContentProjectionSchema } from './projection-schema';
import { TypeRef } from './type-ref';

/**
 * Describes how a `ContentBlockNode` is rendered. Validated config and data outputs are bound to component inputs by
 * template name.
 */
export interface ContentDefinition<TComponent = unknown> {
  /** Unique name, matched against `ContentBlockNode.component`. */
  name: string;

  /** Component rendered for the node, or a lazy loader for it. */
  component: TypeRef<TComponent>;
  /**
   * Rendered synchronously while the node's subtree resolves; its presence makes the node an async boundary.
   * Receives the node and this definition through `node` and `definition` inputs, when it declares them.
   */
  placeholderComponent?: Type<unknown>;
  /**
   * Rendered when the node's boundary fails. Falls back to the renderer default. Receives the node, this definition,
   * and the thrown value through `node`, `definition`, and `error` inputs, when it declares them.
   */
  errorComponent?: TypeRef<unknown>;

  /**
   * Tag name of the host element created for the component, e.g. `a` for a component selected by `a[angTextLink]`.
   * Defaults to the element Angular derives from the component's selector.
   */
  host?: string;
  /** Schema for the node's `config`. When absent, the node must not provide config. */
  config?: ContentConfigSchema;
  /** Schemas for the node's `data`. When absent, the node must not provide data. */
  data?: ContentDataSchema;
  /** Where the node's `content` is projected. When absent, the node must not provide content. */
  content?: ContentProjectionSchema;
}
