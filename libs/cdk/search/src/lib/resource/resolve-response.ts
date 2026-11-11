import { computed, Injector, linkedSignal, resource, ResourceSnapshot, Signal } from '@angular/core';
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
  /**
   * The state of the latest response, for `resourceFromSnapshots`. A loading snapshot keeps the previous value while
   * a request for a new term is pending.
   */
  readonly snapshot: Signal<ResourceSnapshot<readonly T[]>>;
  /** Stops resolving asynchronous responses. */
  destroy(): void;
}

/**
 * Resolves a response that may be synchronous or asynchronous. Synchronous values resolve immediately; promises are
 * resolved with a resource, which ignores stale responses. While a promise is pending, the previous value is kept
 * only if it was produced in the same context.
 *
 * @param response Signal of the latest response and its context.
 * @param injector Injector for the resource.
 * @returns The snapshot of the response and a function that stops resolving it.
 */
export function resolveResponse<T>(response: Signal<ContextualResponse<T>>, injector: Injector): ResolvedResponse<T> {
  const pending = computed(() => {
    const { response: value } = response();
    if (!isPromiseLike(value)) {
      return undefined;
    }
    // The resource only subscribes once its effect runs; until then a rejection would be reported as unhandled
    value.then(undefined, () => undefined);
    return { promise: value };
  });
  const request = resource({
    params: pending,
    loader: ({ params }) => Promise.resolve(params.promise),
    injector,
  });

  const value = linkedSignal<{ value: readonly T[] | undefined; context: object }, readonly T[]>({
    source: () => {
      const { response: current, context } = response();
      if (!isPromiseLike(current)) {
        return { value: current, context };
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

  const snapshot = computed((): ResourceSnapshot<readonly T[]> => {
    if (pending() === undefined) {
      return { status: 'resolved', value: value() };
    }
    const error = request.error();
    if (error) {
      return { status: 'error', error };
    }
    return { status: request.isLoading() ? 'loading' : 'resolved', value: value() };
  });

  return { snapshot, destroy: () => request.destroy() };
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
