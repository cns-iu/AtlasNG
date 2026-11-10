/**
 * Codes of the errors thrown by `@atlasng/cdk`, in the `2000`–`2999` range. Production builds only include the code in
 * the message, formatted as `ANG<code>`.
 */
export enum CdkErrorCode {
  /** A breakpoint expression has more than a breakpoint and a direction. */
  InvalidBreakpointExpression = 2001,
  /** A breakpoint expression's direction is not `up`, `down`, or `only`. */
  InvalidBreakpointDirection = 2002,
  /** A breakpoint expression names a breakpoint that is not configured. */
  UnknownBreakpoint = 2003,
  /** A breakpoint expression combines a length with the `only` direction. */
  OnlyDirectionWithLength = 2004,
  /** A breakpoint width does not use px, em, or rem. */
  InvalidBreakpointWidth = 2005,
  /** `watchBreakpoint` was given an empty list of expressions. */
  MissingBreakpointExpression = 2006,
  /** `provideBreakpoints` was given no breakpoints. */
  EmptyBreakpoints = 2007,
  /** The first configured breakpoint does not begin at 0. */
  FirstBreakpointNotZero = 2008,
  /** Configured breakpoints mix units that cannot be compared. */
  IncomparableBreakpointUnits = 2009,
  /** Configured breakpoints are not ordered by ascending width. */
  UnorderedBreakpoints = 2010,
  /** `provideSearch` was given more than one custom search engine. */
  MultipleSearchEngines = 2011,
}
