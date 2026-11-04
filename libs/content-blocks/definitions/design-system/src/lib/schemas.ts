import { createSchema } from '@atlasng/content-blocks/utils';
import { StandardSchemaV1 } from '@standard-schema/spec';
import { JsonValue, Simplify } from 'type-fest';

/** Schema for a config value, as used by the definitions in this entry point. */
export type ConfigValueSchema<T> = StandardSchemaV1<JsonValue | undefined, T>;

/** Output type of a {@link ConfigValueSchema}. */
type SchemaOutput<S> = S extends ConfigValueSchema<infer T> ? T : never;

/** Output of an {@link object} schema: keys whose schema accepts `undefined` become optional. */
type ObjectOutput<S extends Record<string, ConfigValueSchema<unknown>>> = Simplify<
  { [K in keyof S as undefined extends SchemaOutput<S[K]> ? never : K]: SchemaOutput<S[K]> } & {
    [K in keyof S as undefined extends SchemaOutput<S[K]> ? K : never]?: SchemaOutput<S[K]>;
  }
>;

/**
 * Creates a schema accepting values that pass a check.
 *
 * @param predicate Checks a value.
 * @param message Issue message for values that fail the check.
 * @returns The schema.
 */
function check<T>(predicate: (value: unknown) => value is T, message: string): ConfigValueSchema<T> {
  return createSchema<T, JsonValue | undefined>((value) => (predicate(value) ? { value } : { issues: [{ message }] }));
}

/**
 * Accepts strings.
 *
 * @returns The schema.
 */
export function string(): ConfigValueSchema<string> {
  return check((value): value is string => typeof value === 'string', 'Expected a string.');
}

/**
 * Accepts booleans.
 *
 * @returns The schema.
 */
export function boolean(): ConfigValueSchema<boolean> {
  return check((value): value is boolean => typeof value === 'boolean', 'Expected a boolean.');
}

/**
 * Accepts one of the given values.
 *
 * @param values Allowed values.
 * @returns The schema.
 */
export function oneOf<const T extends readonly (string | number)[]>(values: T): ConfigValueSchema<T[number]> {
  const list = values.map((value) => JSON.stringify(value)).join(', ');
  return check((value): value is T[number] => values.includes(value as T[number]), `Expected one of ${list}.`);
}

/**
 * Accepts heading levels, i.e. the numbers 1 to 6.
 *
 * @returns The schema.
 */
export function headingLevel(): ConfigValueSchema<1 | 2 | 3 | 4 | 5 | 6> {
  return oneOf([1, 2, 3, 4, 5, 6]);
}

/**
 * Makes a schema accept `undefined`, i.e. a missing key.
 *
 * @param schema Schema for present values.
 * @returns The schema.
 */
export function optional<T>(schema: ConfigValueSchema<T>): ConfigValueSchema<T | undefined> {
  return createSchema<T | undefined, JsonValue | undefined>((value) =>
    value === undefined ? { value } : schema['~standard'].validate(value),
  );
}

/**
 * Accepts finite numbers.
 *
 * @returns The schema.
 */
export function number(): ConfigValueSchema<number> {
  return check((value): value is number => typeof value === 'number' && Number.isFinite(value), 'Expected a number.');
}

/**
 * Checks whether a value is a plain JSON object, i.e. not `null` or an array.
 *
 * @param value Value to check.
 * @returns Whether the value is a plain object.
 */
function isPlainObject(value: unknown): value is Record<string, JsonValue | undefined> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Prepends a key to the paths of issues found in a nested value.
 *
 * @param issues Issues of the nested value.
 * @param key Key or index of the nested value.
 * @returns The issues with prefixed paths.
 */
function prefixIssues(issues: readonly StandardSchemaV1.Issue[], key: PropertyKey): StandardSchemaV1.Issue[] {
  return issues.map((issue) => ({ ...issue, path: [key, ...(issue.path ?? [])] }));
}

/**
 * Validates nested values and collects their outputs, and their issues with paths starting at their keys.
 *
 * @param entries Keys, values, and schemas to validate.
 * @returns The outputs in entry order, and the issues of every failing entry.
 */
async function validateEntries(
  entries: [key: PropertyKey, value: unknown, schema: ConfigValueSchema<unknown>][],
): Promise<{ values: unknown[]; issues: StandardSchemaV1.Issue[] }> {
  const results = await Promise.all(entries.map(([, value, schema]) => schema['~standard'].validate(value)));
  return {
    values: results.map((result) => (result.issues ? undefined : result.value)),
    issues: results.flatMap((result, index) => (result.issues ? prefixIssues(result.issues, entries[index][0]) : [])),
  };
}

/**
 * Accepts arrays whose items pass a schema.
 *
 * @param schema Schema for each item.
 * @returns The schema.
 */
export function arrayOf<T>(schema: ConfigValueSchema<T>): ConfigValueSchema<T[]> {
  return createSchema<T[], JsonValue | undefined>(async (value) => {
    if (!Array.isArray(value)) {
      return { issues: [{ message: 'Expected an array.' }] };
    }

    const { values, issues } = await validateEntries(value.map((item, index) => [index, item, schema]));
    return issues.length > 0 ? { issues } : { value: values as T[] };
  });
}

/**
 * Accepts a value passing a schema, or an array of such values.
 *
 * @param schema Schema for the value or each item.
 * @returns The schema.
 */
export function arrayable<T>(schema: ConfigValueSchema<T>): ConfigValueSchema<T | T[]> {
  const items = arrayOf(schema);
  return createSchema<T | T[], JsonValue | undefined>((value) =>
    Array.isArray(value) ? items['~standard'].validate(value) : schema['~standard'].validate(value),
  );
}

/**
 * Accepts objects whose values all pass a schema, e.g. query params.
 *
 * @param schema Schema for each value.
 * @returns The schema.
 */
export function record<T>(schema: ConfigValueSchema<T>): ConfigValueSchema<Record<string, T>> {
  return createSchema<Record<string, T>, JsonValue | undefined>(async (value) => {
    if (!isPlainObject(value)) {
      return { issues: [{ message: 'Expected an object.' }] };
    }

    const keys = Object.keys(value);
    const { values, issues } = await validateEntries(keys.map((key) => [key, value[key], schema]));
    return issues.length > 0
      ? { issues }
      : { value: Object.fromEntries(keys.map((key, index) => [key, values[index] as T])) };
  });
}

/**
 * Accepts objects with the given keys. Unknown keys are errors, a missing key is validated as `undefined`, and
 * `undefined` outputs are left out.
 *
 * @param shape Schema per key.
 * @returns The schema.
 */
export function object<const S extends Record<string, ConfigValueSchema<unknown>>>(
  shape: S,
): ConfigValueSchema<ObjectOutput<S>> {
  return createSchema<ObjectOutput<S>, JsonValue | undefined>(async (value) => {
    if (!isPlainObject(value)) {
      return { issues: [{ message: 'Expected an object.' }] };
    }

    const unknownKeys = Object.keys(value).filter((key) => !Object.hasOwn(shape, key));
    const keys = Object.keys(shape);
    const { values, issues } = await validateEntries(keys.map((key) => [key, value[key], shape[key]]));
    const allIssues = [...unknownKeys.map((key) => ({ message: `Unknown key '${key}'.`, path: [key] })), ...issues];
    if (allIssues.length > 0) {
      return { issues: allIssues };
    }

    const entries = keys.map((key, index) => [key, values[index]]).filter(([, output]) => output !== undefined);
    return { value: Object.fromEntries(entries) as ObjectOutput<S> };
  });
}

/** Route path segments, e.g. `["/people", 42]`, as accepted by Angular's router commands. */
export type ContentLinkSegments = (string | number)[];

/**
 * JSON form of an `AnyLinkCommand` from `@atlasng/common`: an absolute URL or route path such as
 * `https://example.com` or `/docs`, route path segments, or a link command object with URL creation options.
 */
export type ContentLink =
  | string
  | ContentLinkSegments
  | {
      /** URL, route path, or route path segments. */
      command: string | ContentLinkSegments;
      /** Query params added to the URL. A `null` value removes the param. */
      queryParams?: Record<string, string | number | boolean | null | (string | number | boolean | null)[]>;
      /** URL fragment, without `#`. */
      fragment?: string;
      /** How to combine `queryParams` with the current query params. */
      queryParamsHandling?: 'merge' | 'preserve' | 'replace';
      /** Whether to keep the current URL fragment. */
      preserveFragment?: boolean;
    };

/**
 * Accepts route path segments, i.e. arrays of strings and numbers.
 *
 * @returns The schema.
 */
function linkSegments(): ConfigValueSchema<ContentLinkSegments> {
  return arrayOf(
    check(
      (value): value is string | number => typeof value === 'string' || typeof value === 'number',
      'Expected a string or a number.',
    ),
  );
}

/**
 * Accepts a URL or route path string, or route path segments.
 *
 * @returns The schema.
 */
function linkCommand(): ConfigValueSchema<string | ContentLinkSegments> {
  const segments = linkSegments();
  return createSchema<string | ContentLinkSegments, JsonValue | undefined>((value) =>
    Array.isArray(value)
      ? segments['~standard'].validate(value)
      : typeof value === 'string'
        ? { value }
        : { issues: [{ message: 'Expected a string or an array of path segments.' }] },
  );
}

/**
 * Accepts {@link ContentLink} values, i.e. JSON link commands that can be bound to `AnyLinkCommand` inputs. Unsafe URLs
 * such as `javascript:` pass validation; they are sanitized by Angular and ignored by the link handlers.
 *
 * @returns The schema.
 */
export function link(): ConfigValueSchema<ContentLink> {
  const command = linkCommand();
  const options = object({
    command,
    queryParams: optional(
      record(
        arrayable(
          check(
            (value): value is string | number | boolean | null => value === null || typeof value !== 'object',
            'Expected a string, number, boolean, or null.',
          ),
        ),
      ),
    ),
    fragment: optional(string()),
    queryParamsHandling: optional(oneOf(['merge', 'preserve', 'replace'])),
    preserveFragment: optional(boolean()),
  });

  return createSchema<ContentLink, JsonValue | undefined>((value) =>
    isPlainObject(value) ? options['~standard'].validate(value) : command['~standard'].validate(value),
  );
}

/** Cell renderers available to {@link ContentTableColumn}s. */
export type ContentTableColumnType = 'text' | 'number' | 'code' | 'chip' | 'link';

/** JSON description of a table column, rendered with the matching `@atlasng/design-system/table/columns` cell. */
export interface ContentTableColumn {
  /** Row key whose value the column shows. */
  prop: string;
  /** Header label. Defaults to a label derived from `prop`. */
  name?: string;
  /**
   * Cell renderer: `text` (default), `number` (localized, end aligned), `code`, `chip` (one chip per array item), or
   * `link` (the value is a {@link ContentLink}).
   */
  type?: ContentTableColumnType;
  /** Header alignment, and the cell alignment of `text` columns. Defaults to `end` for `number`, else `start`. */
  align?: 'start' | 'center' | 'end';
  /** Whether the column can be sorted. Defaults to `true`. */
  sortable?: boolean;
  /** Minimum column width in pixels. */
  minWidth?: number;
  /** Share of the remaining width the column grows by. Defaults to `1`. */
  flexGrow?: number;
  /** Static label of every link in a `link` column. */
  label?: string;
  /** Row key holding the label of each link in a `link` column. Defaults to `prop`, i.e. the link itself. */
  labelProp?: string;
}

/**
 * Accepts {@link ContentTableColumn}s. `label` and `labelProp` are only accepted for `link` columns, and not together.
 *
 * @returns The schema.
 */
export function tableColumn(): ConfigValueSchema<ContentTableColumn> {
  const shape = object({
    prop: string(),
    name: optional(string()),
    type: optional(oneOf(['text', 'number', 'code', 'chip', 'link'])),
    align: optional(oneOf(['start', 'center', 'end'])),
    sortable: optional(boolean()),
    minWidth: optional(number()),
    flexGrow: optional(number()),
    label: optional(string()),
    labelProp: optional(string()),
  });

  return createSchema<ContentTableColumn, JsonValue | undefined>(async (value) => {
    const result = await shape['~standard'].validate(value);
    if (result.issues) {
      return result;
    }

    const column = result.value;
    const labelKeys = (['label', 'labelProp'] as const).filter((key) => column[key] !== undefined);
    if (labelKeys.length > 0 && column.type !== 'link') {
      return { issues: labelKeys.map((key) => ({ message: 'Only link columns accept a label.', path: [key] })) };
    } else if (labelKeys.length > 1) {
      return { issues: [{ message: 'Expected only one of label and labelProp.', path: ['labelProp'] }] };
    }

    return { value: column };
  });
}

/**
 * Accepts table rows: an array of objects keyed by column `prop`. Values are not validated, so rows can come from any
 * loader or parser, e.g. CSV.
 *
 * @returns The schema.
 */
export function tableRows(): StandardSchemaV1<unknown, Record<string, unknown>[]> {
  return createSchema<Record<string, unknown>[]>((value) =>
    Array.isArray(value) && value.every(isPlainObject)
      ? { value: value as Record<string, unknown>[] }
      : { issues: [{ message: 'Expected an array of objects.' }] },
  );
}

/**
 * Accepts the commonly used subset of YouTube IFrame Player API parameters (`YT.PlayerVars`). Flags take `0` or `1`.
 *
 * @see https://developers.google.com/youtube/player_parameters#Parameters
 * @returns The schema.
 */
export function youTubePlayerVars() {
  const flag = () => optional(oneOf([0, 1]));
  return object({
    /** Starts playback automatically. */
    autoplay: flag(),
    /** Default caption language, as an ISO 639-1 code. */
    cc_lang_pref: optional(string()),
    /** Shows captions by default. */
    cc_load_policy: flag(),
    /** Progress bar color. */
    color: optional(oneOf(['red', 'white'])),
    /** Hides (`0`) or shows (`1`, `2`) the player controls. */
    controls: optional(oneOf([0, 1, 2])),
    /** Disables keyboard controls. */
    disablekb: flag(),
    /** Time, in seconds, at which playback stops. */
    end: optional(number()),
    /** Shows the fullscreen button. */
    fs: flag(),
    /** Player interface language, as an ISO 639-1 code. */
    hl: optional(string()),
    /** Shows (`1`) or hides (`3`) video annotations. */
    iv_load_policy: optional(oneOf([1, 3])),
    /** Plays the video, or `playlist`, in a loop. */
    loop: flag(),
    /** Starts muted. */
    mute: flag(),
    /** Comma separated video IDs to play after `videoId`. */
    playlist: optional(string()),
    /** Plays inline on iOS instead of fullscreen. */
    playsinline: flag(),
    /** Limits related videos to the same channel (`0`) or allows any channel (`1`). */
    rel: flag(),
    /** Time, in seconds, at which playback starts. */
    start: optional(number()),
  });
}
