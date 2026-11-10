/**
 * Codes of the errors thrown by `@atlasng/common`, in the `1000`–`1999` range. Production builds only include the code
 * in the message, formatted as `ANG<code>`.
 */
export enum CommonErrorCode {
  /** `provideLinkHandler` received more than one handler strategy. */
  MultipleLinkHandlers = 1001,
  /** `angAnyLink` was given a `UrlTree` together with query params or fragment options. */
  UrlTreeWithNavigationOptions = 1002,
}
