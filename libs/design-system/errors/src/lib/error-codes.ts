/**
 * Codes of the errors thrown by `@atlasng/design-system`, in the `4000`–`4999` range. Production builds only include
 * the code in the message, formatted as `ANG<code>`.
 */
export enum DesignSystemErrorCode {
  /** A heading level is not an integer from 1 through 6. */
  InvalidHeadingLevel = 4001,
  /** `ang-social-media-button` has neither an `id` nor a `definition` input. */
  MissingSocialMediaButtonInput = 4002,
  /** No social media button definition matches the given `id`. */
  UnknownSocialMediaButtonId = 4003,
  /** A date passed to `LastModifiedDates.set` is invalid. */
  InvalidLastModifiedDate = 4004,
}
