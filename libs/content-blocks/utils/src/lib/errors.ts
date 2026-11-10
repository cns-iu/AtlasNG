/**
 * Codes of the errors thrown by `@atlasng/content-blocks`, in the `5000`–`5999` range. Production builds only include
 * the code in the message, formatted as `ANG<code>`.
 */
export enum ContentBlocksErrorCode {
  /** A boundary's `start` was called more than once. */
  BoundaryAlreadyStarted = 5001,
  /** A component loader resolved to something other than a component class. */
  InvalidComponentLoader = 5002,
  /** A data source completed without emitting a value. */
  DataCompletedWithoutValue = 5003,
  /** A node's definition or result was read before the pipeline started it. */
  NodeNotStarted = 5004,
}
