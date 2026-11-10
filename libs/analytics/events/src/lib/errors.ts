/**
 * Codes of the errors thrown by `@atlasng/analytics`, in the `3000`–`3999` range. Production builds only include the
 * code in the message, formatted as `ANG<code>`.
 */
export enum AnalyticsErrorCode {
  /** The analytics backend does not support aborting events, which the event filter plugin requires. */
  AbortNotSupported = 3001,
  /** The analytics instance was not created by the default backend, so it has no event filter plugin. */
  MissingEventFilterPlugin = 3002,
  /** The telemetry plugin received a payload type it cannot convert. */
  UnsupportedTelemetryPayload = 3003,
  /** `AnalyticsPermissions.fromJSON` was given JSON that is not an object. */
  InvalidPermissionsJson = 3004,
}
