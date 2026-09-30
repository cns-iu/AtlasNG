import { isObservable, Subscription } from 'rxjs';
import { AsyncValue } from '../types/content-data';

/**
 * Converts an {@link AsyncValue} into a promise. Observables use their first emission and are unsubscribed when the
 * signal aborts.
 *
 * @param value Value, promise, or observable.
 * @param signal Aborts a pending observable subscription.
 * @returns Promise of the value. Rejects with the abort reason on abort, or when an observable completes without
 *   emitting.
 */
export function fromAsyncValue<T>(value: AsyncValue<T>, signal: AbortSignal): Promise<T> {
  if (!isObservable(value)) {
    return Promise.resolve(value);
  }

  return new Promise<T>((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }

    // Container subscription, so a synchronous emission can unsubscribe before `subscribe` returns.
    const subscription = new Subscription();
    const settle = (callback: () => void) => {
      signal.removeEventListener('abort', onAbort);
      subscription.unsubscribe();
      callback();
    };
    const onAbort = () => settle(() => reject(signal.reason));

    signal.addEventListener('abort', onAbort, { once: true });
    subscription.add(
      value.subscribe({
        next: (result) => settle(() => resolve(result)),
        error: (error: unknown) => settle(() => reject(error)),
        complete: () => settle(() => reject(new Error('Observable completed without emitting a value.'))),
      }),
    );
  });
}

/**
 * Marks a promise as handled so an unobserved rejection is not reported, while callers awaiting it still see it.
 *
 * @param promise Promise to mark.
 * @returns The same promise.
 */
export function handled<T>(promise: Promise<T>): Promise<T> {
  promise.catch(() => undefined);
  return promise;
}
