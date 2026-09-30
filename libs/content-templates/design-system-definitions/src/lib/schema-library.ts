import { StandardSchemaV1 } from '@standard-schema/spec';

/**
 * A schema created by a {@link ContentSchemaLibrary}. Mirrors the subset of zod's schema API used by the definitions.
 * Output and input types are given in that order, like zod's `ZodType`.
 */
export interface ContentSchema<TOutput, TInput = TOutput> extends StandardSchemaV1<TInput, TOutput> {
  /**
   * Creates a schema that also accepts `undefined`.
   *
   * @returns The optional schema.
   */
  optional(): ContentSchema<TOutput | undefined, TInput | undefined>;
}

/**
 * Schema factories used to build the design-system definitions, modeled after zod. Zod's `z` satisfies it; other
 * Standard Schema libraries can be adapted with a small wrapper.
 */
export interface ContentSchemaLibrary {
  /**
   * Creates a string schema.
   *
   * @returns The schema.
   */
  string(): ContentSchema<string>;
  /**
   * Creates a number schema.
   *
   * @returns The schema.
   */
  number(): ContentSchema<number>;
  /**
   * Creates a boolean schema.
   *
   * @returns The schema.
   */
  boolean(): ContentSchema<boolean>;
}
