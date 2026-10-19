/**
 * Key of a {@link ContentProjectionSchema} naming the entry that receives unkeyed content, for components without a
 * catch-all `*` selector.
 */
export const DEFAULT_CONTENT = Symbol('DEFAULT_CONTENT');

/**
 * Maps friendly content names used as keys of a node's `content` to the component's `ng-content` selectors, e.g.
 * `{ body: '*', actions: '[actions]' }`.
 *
 * Content that is not keyed by name goes to the entry named by {@link DEFAULT_CONTENT}, or else to the entry whose
 * selector is `*`. Without either, unkeyed content cannot be projected.
 */
export type ContentProjectionSchema = Record<string, string> & {
  /** Name of the entry receiving unkeyed content. Defaults to the entry whose selector is `*`. */
  [DEFAULT_CONTENT]?: string;
};
