/**
 * Codes of the errors thrown by `@atlasng/analytics`, in the `3000`–`3999` range. Production builds only include the
 * code in the message, formatted as `ANG<code>`.
 *
 * Codes are grouped by entry point: `30xx` for the main entry point and generic errors, `31xx` for `events`, `32xx`
 * for `permissions`, and `33xx` for `default-backend`.
 */
export enum AnalyticsErrorCode {
  /** More than one custom analytics backend was provided. */
  MultipleCustomBackends = 3001,
  /** Both a custom backend and the default backend were provided. */
  ConflictingBackends = 3002,
  /** No analytics backend was provided. */
  MissingBackend = 3003,
  /** `AnalyticsPermissions.fromJSON` was given JSON that is not an object. */
  InvalidPermissionsJson = 3201,
  /** The analytics backend does not support aborting events, which the event filter plugin requires. */
  AbortNotSupported = 3301,
  /** The analytics instance was not created by the default backend, so it has no event filter plugin. */
  MissingEventFilterPlugin = 3302,
  /** The telemetry plugin received a payload type it cannot convert. */
  UnsupportedTelemetryPayload = 3303,
}
