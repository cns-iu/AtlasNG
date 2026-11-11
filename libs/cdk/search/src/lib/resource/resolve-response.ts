import { computed, Injector, linkedSignal, resource, Signal } from '@angular/core';
import { SearchResponse } from '../engine/types';

/** A response together with the inputs, other than the term, that produced it. */
export interface ContextualResponse<T> {
  /** The response. */
  readonly response: SearchResponse<T>;
  /** Identity of the inputs other than the term. Previous values are only kept while this stays the same. */
  readonly context: object;
}

/** The state of a response that may be asynchronous. */
export interface ResolvedResponse<T> {
  /** The latest resolved value. Keeps the previous value while a request for a new term is pending. */
  readonly value: Signal<readonly T[]>;
  /** True while a request is pending. */
  readonly loading: Signal<boolean>;
  /** The error of the last failed request. */
  readonly error: Signal<unknown>;
}

/**
 * Resolves a response that may be synchronous or asynchronous. Synchronous values pass through immediately;
 * promises are resolved with a resource, which ignores stale responses. While a promise is pending, the previous
 * value is kept only if it was produced in the same context.
 *
 * @param response Signal of the latest response and its context.
 * @param injector Injector for the resource.
 * @returns The resolved value, loading state, and error.
 */
export function resolveResponse<T>(response: Signal<ContextualResponse<T>>, injector: Injector): ResolvedResponse<T> {
  const pending = computed(() => {
    const { response: value } = response();
    return isPromiseLike(value) ? { promise: value } : undefined;
  });
  const request = resource({
    params: pending,
    loader: ({ params }) => Promise.resolve(params.promise),
    injector,
  });
  const failed = computed(() => pending() !== undefined && request.status() === 'error');

  const value = linkedSignal<{ value: readonly T[] | undefined; context: object }, readonly T[]>({
    source: () => {
      const { response: current, context } = response();
      if (!isPromiseLike(current)) {
        return { value: current, context };
      } else if (failed()) {
        return { value: [], context };
      }
      return { value: request.hasValue() ? request.value() : undefined, context };
    },
    computation: (current, previous) => {
      if (current.value) {
        return current.value;
      }
      return previous?.source.context === current.context ? previous.value : [];
    },
  });

  return {
    value: value.asReadonly(),
    loading: computed(() => pending() !== undefined && request.isLoading()),
    error: computed(() => (failed() ? request.error() : undefined)),
  };
}

/**
 * Checks whether a value is a promise-like object.
 *
 * @param value Value to check.
 * @returns True when the value has a `then` method.
 */
function isPromiseLike<T>(value: SearchResponse<T>): value is PromiseLike<readonly T[]> {
  return typeof (value as Partial<PromiseLike<unknown>>).then === 'function';
}
