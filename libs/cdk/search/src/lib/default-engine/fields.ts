import { SearchFieldSpec, SearchRange } from '../engine/types';
import { DEFAULT_SEARCH_VALUE_FIELD, isSearchPrimitive } from '../engine/values';
import { NormalizedText, normalizeWithOffsets, toOriginalRange } from '../text/normalize';
import { mergeRanges } from '../text/ranges';

/** A normalized value of an indexed field. */
export interface IndexedValue extends NormalizedText {
  /** The original value. */
  readonly original: string;
  /** Position of the value in the field value when the field value is an array. */
  readonly index?: number;
  /** Number of leading whitespace units in the normalized text. */
  readonly lead: number;
  /** Length of the normalized text without surrounding whitespace. */
  readonly trimmedLength: number;
}

/** The normalized values of one field of an item. */
export interface IndexedField {
  /** Field name. */
  readonly name: string;
  /** Score multiplier. */
  readonly weight: number;
  /** Normalized values. */
  readonly values: readonly IndexedValue[];
}

/** An indexed item. */
export interface IndexedItem<T> {
  /** The original item. */
  readonly item: T;
  /** Normalized fields. */
  readonly fields: readonly IndexedField[];
}

/** A resolved field definition. */
export interface ResolvedField<T> {
  /** Field name. */
  readonly name: string;
  /** Score multiplier. */
  readonly weight: number;
  /**
   * Reads the field values of an item.
   *
   * @param item Item to read.
   * @returns The field values.
   */
  readonly get: (item: T) => unknown;
}

/**
 * Resolves a field into a definition.
 *
 * @param field A key or field definition.
 * @returns The resolved field.
 */
export function resolveField<T>(field: SearchFieldSpec<T>): ResolvedField<T> {
  if (typeof field === 'string') {
    return { name: field, weight: 1, get: (item) => readKey(item, field) };
  }
  return { name: field.name, weight: field.weight ?? 1, get: (item) => field.get(item) };
}

/**
 * Derives the default fields of an item: the item itself when it is a string or number, otherwise each of its own
 * enumerable properties.
 *
 * @param item Item to derive fields for.
 * @returns The item's default fields.
 */
export function defaultFields<T>(item: T): ResolvedField<T>[] {
  if (isSearchPrimitive(item)) {
    return [{ name: DEFAULT_SEARCH_VALUE_FIELD, weight: 1, get: (value) => value }];
  }
  if (typeof item !== 'object' || item === null) {
    return [];
  }
  return Object.keys(item).map((key) => ({ name: key, weight: 1, get: (value) => readKey(value, key) }));
}

/**
 * Reads a property of an item. Keys are not type-checked against the item's values, so anything that is not an
 * object yields `undefined`.
 *
 * @param item Item to read.
 * @param key Property name.
 * @returns The property value, or `undefined`.
 */
function readKey(item: unknown, key: string): unknown {
  return typeof item === 'object' && item !== null ? (item as Record<string, unknown>)[key] : undefined;
}

/**
 * Reads and normalizes a field of an item.
 *
 * @param field Field to read.
 * @param item Item to read.
 * @returns The indexed field.
 */
export function indexField<T>(field: ResolvedField<T>, item: T): IndexedField {
  const values = toStrings(field.get(item)).map(({ original, index }): IndexedValue => {
    const normalized = normalizeWithOffsets(original);
    const lead = normalized.text.length - normalized.text.trimStart().length;
    return { ...normalized, original, index, lead, trimmedLength: normalized.text.trim().length };
  });
  return { name: field.name, weight: field.weight, values };
}

/**
 * Converts a field value into the strings to search. Values other than strings, numbers, and arrays of them are
 * ignored.
 *
 * @param value Field value.
 * @returns Searchable strings, with their position when the value is an array.
 */
function toStrings(value: unknown): { original: string; index?: number }[] {
  if (!Array.isArray(value)) {
    return isSearchPrimitive(value) ? [{ original: String(value) }] : [];
  }
  return value.flatMap((entry: unknown, index) =>
    isSearchPrimitive(entry) ? [{ original: String(entry), index }] : [],
  );
}

/**
 * Maps normalized ranges of a value onto its original text and merges them.
 *
 * @param value Indexed value.
 * @param ranges Normalized ranges.
 * @returns Sorted, non-overlapping ranges of the original value.
 */
export function toOriginalRanges(value: IndexedValue, ranges: readonly SearchRange[]): SearchRange[] {
  return mergeRanges(ranges.map(([start, end]) => toOriginalRange(value, start, end)));
}
