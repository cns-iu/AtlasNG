import { BreakpointObserver } from '@angular/cdk/layout';
import { assertInInjectionContext, inject, InjectionToken, Injector, Provider, Signal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CdkErrorCode } from '@atlasng/cdk/errors';
import { AngError } from '@atlasng/core';
import { map } from 'rxjs';

/** Direction modifiers supported in a breakpoint expression. */
export type BreakpointDirection = 'up' | 'down' | 'only';

/** Units supported by breakpoint widths. */
export type BreakpointUnit = 'px' | 'em' | 'rem';

/** A breakpoint width. Plain numbers are interpreted as pixels. */
export type BreakpointWidth = number | `${number}${BreakpointUnit}`;

/**
 * Named breakpoint minimum widths. Keys must be ordered from smallest to largest
 * width and the first breakpoint must begin at zero.
 */
export type Breakpoints = Readonly<Record<string, BreakpointWidth>>;

/** Names of the default breakpoints. */
export type DefaultBreakpointName = 'x-small' | 'small' | 'medium' | 'large' | 'x-large';

/**
 * A breakpoint name or length, optionally followed by a space and `up`, `down`,
 * or `only`, e.g. `'medium'`, `'medium only'`, `'600px down'`, or `600`.
 * Mirrors the expressions accepted by the design-system Sass `breakpoint()` mixin.
 */
export type BreakpointExpression =
  DefaultBreakpointName | `${DefaultBreakpointName} ${BreakpointDirection}` | (string & {}) | number;

/** Options for the breakpoint watcher functions. */
export interface WatchBreakpointOptions {
  /** Injector used outside an injection context. */
  injector?: Injector;
}

/** Default breakpoints. Kept in sync with `$breakpoints` in the design-system Sass. */
export const DEFAULT_BREAKPOINTS = {
  'x-small': 0,
  small: 600,
  medium: 960,
  large: 1280,
  'x-large': 1920,
} as const satisfies Breakpoints;

/** Breakpoints used by {@link watchBreakpoint} and {@link watchActiveBreakpoint}. */
export const BREAKPOINTS = new InjectionToken<Breakpoints>('BREAKPOINTS', {
  providedIn: 'root',
  factory: () => DEFAULT_BREAKPOINTS,
});

/** Valid breakpoint directions. */
const BREAKPOINT_DIRECTIONS: readonly BreakpointDirection[] = ['up', 'down', 'only'];

/** Amount subtracted from the next breakpoint to create an exclusive upper bound. */
const EXCLUSIVE_INTERVALS: Record<BreakpointUnit, number> = {
  px: 0.02,
  em: 0.00125,
  rem: 0.00125,
};

/** Matches a length such as `600`, `600px`, or `37.5em`. */
const LENGTH_PATTERN = /^(\d*\.?\d+)(px|em|rem)?$/;

/** A parsed breakpoint width. */
interface Length {
  /** Numeric value. */
  value: number;
  /** CSS unit. */
  unit: BreakpointUnit;
}

/**
 * Provides custom breakpoints. Use this when the design-system Sass `$breakpoints`
 * map has been reconfigured so script and style breakpoints stay in sync.
 *
 * @param breakpoints Named breakpoint minimum widths.
 * @returns A provider for {@link BREAKPOINTS}.
 * @throws AngError in dev mode if the breakpoints are empty, unordered, mix units, or do not begin at zero.
 */
export function provideBreakpoints(breakpoints: Breakpoints): Provider {
  validateBreakpoints(breakpoints);
  return { provide: BREAKPOINTS, useValue: breakpoints };
}

/**
 * Generates a media query condition for a breakpoint expression, mirroring the
 * design-system Sass `breakpoint()` function.
 *
 * A bare named breakpoint selects that width and larger widths. `only` stops
 * immediately before the next named breakpoint and `down` selects the named
 * breakpoint and every smaller width. Unlike the Sass mixin, no media type
 * (`screen`/`print`) is included.
 *
 * @param expression Breakpoint expression.
 * @param breakpoints Named breakpoints to resolve names against.
 * @returns A media query condition, or an empty string when the expression covers every width.
 * @throws AngError if the expression is invalid.
 */
export function breakpointQuery(
  expression: BreakpointExpression,
  breakpoints: Breakpoints = DEFAULT_BREAKPOINTS,
): string {
  const parts = String(expression).trim().split(/\s+/);
  if (parts.length > 2) {
    throw new AngError(
      CdkErrorCode.InvalidBreakpointExpression,
      (typeof ngDevMode === 'undefined' || ngDevMode) &&
        `Invalid breakpoint expression: ${expression}. Expected a breakpoint followed by up, down, or only.`,
    );
  }

  const [bp, direction = 'up'] = parts as [string, BreakpointDirection | undefined];
  if (!BREAKPOINT_DIRECTIONS.includes(direction)) {
    throw new AngError(
      CdkErrorCode.InvalidBreakpointDirection,
      (typeof ngDevMode === 'undefined' || ngDevMode) &&
        `Invalid breakpoint direction: ${direction}. Valid directions are ${BREAKPOINT_DIRECTIONS.join(', ')}.`,
    );
  }

  const names = Object.keys(breakpoints);
  const isNamed = !LENGTH_PATTERN.test(bp);
  if (isNamed && !(bp in breakpoints)) {
    throw new AngError(
      CdkErrorCode.UnknownBreakpoint,
      (typeof ngDevMode === 'undefined' || ngDevMode) &&
        `Invalid breakpoint: ${bp}. Valid breakpoints are ${names.join(', ')}.`,
    );
  }
  if (!isNamed && direction === 'only') {
    throw new AngError(
      CdkErrorCode.OnlyDirectionWithLength,
      (typeof ngDevMode === 'undefined' || ngDevMode) && 'Only named breakpoints can use the only direction.',
    );
  }

  const width = parseWidth(isNamed ? breakpoints[bp] : bp);
  const nextName = isNamed ? names[names.indexOf(bp) + 1] : undefined;
  const next = nextName === undefined ? undefined : parseWidth(breakpoints[nextName]);

  let min: Length | undefined;
  let max: Length | undefined;
  if ((direction === 'up' || direction === 'only') && width.value > 0) {
    min = width;
  }
  if (direction === 'down' || direction === 'only') {
    if (!isNamed) {
      max = width;
    } else if (next) {
      max = exclusiveUpperBound(next);
    }
  }

  return [min && `(min-width: ${formatLength(min)})`, max && `(max-width: ${formatLength(max)})`]
    .filter(Boolean)
    .join(' and ');
}

/**
 * Watches one or more breakpoint expressions, mirroring the design-system Sass
 * `breakpoint()` mixin. Must be called in an injection context unless an injector is provided.
 *
 * @param expressions A breakpoint expression or a list of expressions.
 * @param options Watcher options.
 * @returns A signal that is true while any of the expressions match the viewport.
 * @throws AngError if no expressions are given or an expression is invalid.
 * @example
 * readonly isDesktop = watchBreakpoint('medium');
 * readonly isCompact = watchBreakpoint(['small down', 'x-large']);
 */
export function watchBreakpoint(
  expressions: BreakpointExpression | readonly BreakpointExpression[],
  options: WatchBreakpointOptions = {},
): Signal<boolean> {
  const injector = resolveInjector(watchBreakpoint, options);
  const breakpoints = injector.get(BREAKPOINTS);
  const queries = [expressions].flat().map((expression) => breakpointQuery(expression, breakpoints));

  if (queries.length === 0) {
    throw new AngError(
      CdkErrorCode.MissingBreakpointExpression,
      (typeof ngDevMode === 'undefined' || ngDevMode) &&
        'watchBreakpoint() requires at least one breakpoint expression.',
    );
  }
  if (queries.includes('')) {
    return signal(true).asReadonly();
  }

  const state$ = injector.get(BreakpointObserver).observe(queries);
  return toSignal(state$.pipe(map((state) => state.matches)), { requireSync: true, injector });
}

/**
 * Watches the active named breakpoint, i.e. the largest breakpoint whose minimum
 * width the viewport meets. Must be called in an injection context unless an injector is provided.
 *
 * @param options Watcher options.
 * @returns A signal with the name of the active breakpoint.
 * @example
 * readonly breakpoint = watchActiveBreakpoint();
 * readonly columns = computed(() => (this.breakpoint() === 'x-small' ? 1 : 3));
 */
export function watchActiveBreakpoint(options: WatchBreakpointOptions = {}): Signal<string> {
  const injector = resolveInjector(watchActiveBreakpoint, options);
  const breakpoints = injector.get(BREAKPOINTS);
  const names = Object.keys(breakpoints);
  const queries = names.map((name) => breakpointQuery(name, breakpoints));
  const observed = queries.filter(Boolean);

  if (observed.length === 0) {
    return signal(names[0]).asReadonly();
  }

  const state$ = injector.get(BreakpointObserver).observe(observed);
  const active$ = state$.pipe(
    map((state) => names.filter((_name, index) => queries[index] === '' || state.breakpoints[queries[index]]).at(-1)),
    map((name) => name ?? names[0]),
  );
  return toSignal(active$, { requireSync: true, injector });
}

/**
 * Resolves the injector for a watcher function.
 *
 * @param fn Watcher function, used in the injection context assertion message.
 * @param options Watcher options.
 * @returns The provided injector or the current context's injector.
 */
function resolveInjector(fn: (...args: never[]) => unknown, options: WatchBreakpointOptions): Injector {
  if (options.injector) {
    return options.injector;
  }

  assertInInjectionContext(fn);
  return inject(Injector);
}

/**
 * Parses a breakpoint width.
 *
 * @param width A number of pixels or a length string.
 * @returns The parsed length.
 * @throws AngError if the width is not a supported length.
 */
function parseWidth(width: BreakpointWidth | string): Length {
  const match = LENGTH_PATTERN.exec(String(width));
  if (match) {
    return { value: Number(match[1]), unit: (match[2] as BreakpointUnit | undefined) ?? 'px' };
  }

  throw new AngError(
    CdkErrorCode.InvalidBreakpointWidth,
    (typeof ngDevMode === 'undefined' || ngDevMode) && `Breakpoint widths must use px, em, or rem; received ${width}.`,
  );
}

/**
 * Creates an inclusive maximum immediately below a breakpoint width.
 *
 * @param width The next named breakpoint's minimum width.
 * @returns A maximum width below the supplied width.
 */
function exclusiveUpperBound(width: Length): Length {
  const value = Number((width.value - EXCLUSIVE_INTERVALS[width.unit]).toFixed(10));
  return { value, unit: width.unit };
}

/**
 * Formats a length for use in a media query.
 *
 * @param length The length to format.
 * @returns The CSS length.
 */
function formatLength(length: Length): string {
  return length.value === 0 ? '0' : `${length.value}${length.unit}`;
}

/**
 * Validates a breakpoints configuration in dev mode, mirroring the design-system Sass validation.
 *
 * @param breakpoints Named breakpoint minimum widths.
 * @throws AngError if the configuration is invalid.
 */
function validateBreakpoints(breakpoints: Breakpoints): void {
  if (!(typeof ngDevMode === 'undefined' || ngDevMode)) {
    return;
  }

  const entries = Object.entries(breakpoints);
  if (entries.length === 0) {
    throw new AngError(CdkErrorCode.EmptyBreakpoints, 'Breakpoints must contain at least one breakpoint.');
  }

  let previous: Length | undefined;
  for (const [name, configured] of entries) {
    const width = parseWidth(configured);
    if (!previous && width.value !== 0) {
      throw new AngError(
        CdkErrorCode.FirstBreakpointNotZero,
        `The first breakpoint must begin at 0; ${name} begins at ${configured}.`,
      );
    }
    if (previous && previous.value !== 0 && width.unit !== previous.unit) {
      throw new AngError(
        CdkErrorCode.IncomparableBreakpointUnits,
        `Breakpoint widths must use mutually comparable units; ${name} is ${configured}.`,
      );
    }
    if (previous && width.value <= previous.value) {
      throw new AngError(
        CdkErrorCode.UnorderedBreakpoints,
        `Breakpoints must be ordered by ascending width; ${name} is ${configured}.`,
      );
    }
    previous = width;
  }
}
