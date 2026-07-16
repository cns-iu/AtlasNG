import { HttpErrorResponse } from '@angular/common/http';
import { stringify } from 'qs';

/**
 * Minimal shape used to detect and serialize Zod-like validation errors.
 */
interface ZodErrorLike {
  /**
   * Runtime error name used by Zod implementations.
   */
  name: 'ZodError' | '$ZodError';
  /**
   * Human-readable error summary.
   */
  message: string;
  /**
   * Validation issue entries provided by the parser.
   */
  issues: unknown[];
  /**
   * Optional stack trace associated with the error.
   */
  stack?: string;
}

/**
 * Maximum number of characters retained when serializing stack traces.
 */
const MAX_STACK_LENGTH = 2000;

/**
 * Serializes telemetry payloads into a query-string representation.
 *
 * @param data Raw telemetry payload.
 * @returns Query string for GET-based telemetry submission.
 */
export function serializeTelemetryData(data: unknown): string {
  return stringify(data, {
    allowDots: true,
    arrayFormat: 'indices',
    skipNulls: true,
    filter: (_key, value) => serializeTelemetryValue(value),
  });
}

/**
 * Normalizes complex JavaScript values into telemetry-safe representations.
 *
 * @param value Value to normalize.
 * @returns Serialized-safe value.
 */
export function serializeTelemetryValue(value: unknown): unknown {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return value;
  }

  // Basic types
  if (value instanceof Date) {
    return value.toISOString();
  } else if (value instanceof Map) {
    return { map: [...value] };
  } else if (value instanceof Set) {
    return { set: [...value] };
  }

  // DOM events
  if (value instanceof KeyboardEvent) {
    return pick(value, ['type', 'key', 'code', 'altKey', 'ctrlKey', 'shiftKey', 'metaKey'], filterFalse);
  } else if (value instanceof MouseEvent) {
    const isLinkTarget = value.target instanceof Element && ['A', 'AREA'].includes(value.target.tagName);
    const props = pick(value, ['type', 'button', 'buttons', 'altKey', 'ctrlKey', 'shiftKey', 'metaKey'], filterFalse);
    const targetProps = isLinkTarget ? pickAttributes(value.target, ['href', 'target', 'download', 'type']) : {};
    return { ...props, ...targetProps };
  } else if (value instanceof ErrorEvent) {
    const props = pick(value, ['message', 'filename', 'lineno', 'colno']);
    return { ...props, error: serializeTelemetryValue(value.error) };
  } else if (value instanceof Event) {
    return pick(value, ['type']);
  }

  // Various error types
  if (isZodErrorLike(value)) {
    const props = pick(value, ['name', 'message', 'issues']);
    return { ...props, stack: serializeStack(value.stack) };
  } else if (value instanceof HttpErrorResponse) {
    const props = pick(value, ['status', 'url', 'message']);
    return { ...props, error: serializeTelemetryValue(value.error) };
  } else if (value instanceof Error) {
    const props = pick(value, ['name', 'message']);
    return { ...props, stack: serializeStack(value.stack) };
  }

  return value;
}

/**
 * Trims and compacts stack traces to a bounded string length.
 *
 * @param stack Original stack trace.
 * @param maxLength Maximum output length in characters.
 * @returns Truncated stack trace, or undefined when input is missing.
 */
function serializeStack(stack: string | undefined, maxLength = MAX_STACK_LENGTH): string | undefined {
  if (!stack) {
    return undefined;
  }

  const lines = stack
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const result: string[] = [];
  let length = 0;

  for (const line of lines) {
    if (length + line.length + 1 > maxLength) {
      result.push('...');
      break;
    }
    result.push(line);
    length += line.length + 1;
  }

  return result.join('\n');
}

/**
 * Checks whether an object matches the minimum structure of a Zod error.
 *
 * @param obj Candidate object.
 * @returns True when the object can be treated as a Zod-like error.
 */
function isZodErrorLike(obj: object): obj is ZodErrorLike {
  return (
    'name' in obj &&
    'message' in obj &&
    'issues' in obj &&
    (obj.name === 'ZodError' || obj.name === '$ZodError') &&
    typeof obj.message === 'string' &&
    Array.isArray(obj.issues)
  );
}

/**
 * Picks specific keys from an object while filtering out empty values.
 *
 * @param obj Source object.
 * @param keys Keys to include in the result.
 * @param filter Optional predicate to reject values.
 * @returns Partial object containing selected key/value pairs.
 */
function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
  filter?: (key: K, value: unknown) => boolean,
): Partial<Pick<T, K>> {
  return keys.reduce<Partial<Pick<T, K>>>((acc, key) => {
    if (key in obj) {
      const value = obj[key];
      if (value !== undefined && value !== null && (!filter || filter(key, value))) {
        acc[key] = value;
      }
    }

    return acc;
  }, {});
}

/**
 * Extracts selected attributes from a DOM element.
 *
 * @param el Element to read attributes from.
 * @param keys Attribute names to extract.
 * @returns Object with found attribute values.
 */
function pickAttributes<T extends Element, K extends string>(el: T, keys: K[]): Partial<Record<K, string>> {
  return keys.reduce<Partial<Record<K, string>>>((acc, key) => {
    const attrValue = el.getAttribute(key);
    if (attrValue !== null) {
      acc[key] = attrValue;
    }

    return acc;
  }, {});
}

/**
 * Drops boolean flags that are explicitly false.
 *
 * @param _key Property key currently being filtered.
 * @param value Candidate property value.
 * @returns True when the value should be kept.
 */
function filterFalse(_key: string, value: unknown): boolean {
  return value !== false;
}
