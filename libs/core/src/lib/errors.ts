/**
 * Formats an AtlasNG error code, e.g. `ANG3001` for `3001`.
 *
 * @param code Numeric error code.
 * @returns The prefixed, zero-padded code.
 */
export function formatAngErrorCode(code: number): string {
  return `ANG${String(code).padStart(4, '0')}`;
}

/**
 * Error with a stable numeric code, modelled on Angular's `RuntimeError`. Pass the message only in dev mode, so
 * production bundles drop the string and keep the code:
 *
 * ```ts
 * throw new AngError(
 *   AnalyticsErrorCode.InvalidPermissionsJson,
 *   (typeof ngDevMode === 'undefined' || ngDevMode) && 'Invalid AnalyticsPermissions JSON',
 * );
 * ```
 *
 * Each library owns a range of codes; see the `@atlasng/core` README.
 */
export class AngError<C extends number = number> extends Error {
  /** Numeric error code. */
  readonly code: C;

  /**
   * @param code Numeric error code.
   * @param message Dev-mode message; omitted from the formatted message when falsy.
   */
  constructor(code: C, message?: string | false | null) {
    super(formatAngErrorCode(code) + (message ? `: ${message}` : ''));
    this.name = 'AngError';
    this.code = code;
  }
}
