/**
 * Codes of the errors thrown by `@atlasng/analytics`, in the `3000`–`3999` range. Production builds only include the
 * code in the message, formatted as `ANG<code>`.
 *
 * Codes are grouped by entry point: `30xx` for the main entry point and generic errors, `31xx` for `default-backend`,
 * `32xx` for `events`, and `33xx` for `permissions`.
 */
export enum AnalyticsErrorCode {
  /** The analytics backend does not support aborting events, which the event filter plugin requires. */
  AbortNotSupported = 3101,
  /** The analytics instance was not created by the default backend, so it has no event filter plugin. */
  MissingEventFilterPlugin = 3102,
  /** The telemetry plugin received a payload type it cannot convert. */
  UnsupportedTelemetryPayload = 3103,
  /** `AnalyticsPermissions.fromJSON` was given JSON that is not an object. */
  InvalidPermissionsJson = 3301,
}
