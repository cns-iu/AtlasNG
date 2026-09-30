import { EMPTY, NEVER, of, Subject, throwError } from 'rxjs';
import { fromAsyncValue, handled } from './async-utils';

describe('fromAsyncValue', () => {
  const signal = new AbortController().signal;

  it('resolves plain values and promises', async () => {
    await expect(fromAsyncValue(1, signal)).resolves.toBe(1);
    await expect(fromAsyncValue(Promise.resolve(2), signal)).resolves.toBe(2);
  });

  it('resolves the first emission of an observable', async () => {
    const subject = new Subject<number>();
    const promise = fromAsyncValue(subject, signal);
    subject.next(1);
    subject.next(2);

    await expect(promise).resolves.toBe(1);
    expect(subject.observed).toBe(false);
  });

  it('resolves synchronous emissions', async () => {
    await expect(fromAsyncValue(of(3), signal)).resolves.toBe(3);
  });

  it('rejects on errors and on completion without a value', async () => {
    await expect(
      fromAsyncValue(
        throwError(() => new Error('failed')),
        signal,
      ),
    ).rejects.toThrow('failed');
    await expect(fromAsyncValue(EMPTY, signal)).rejects.toThrow('Observable completed without emitting a value.');
  });

  it('unsubscribes and rejects when aborted', async () => {
    const controller = new AbortController();
    const subject = new Subject<number>();
    const promise = fromAsyncValue(subject, controller.signal);

    controller.abort(new Error('aborted'));

    await expect(promise).rejects.toThrow('aborted');
    expect(subject.observed).toBe(false);
  });

  it('rejects immediately when already aborted', async () => {
    await expect(fromAsyncValue(NEVER, AbortSignal.abort(new Error('aborted')))).rejects.toThrow('aborted');
  });
});

describe('handled', () => {
  it('returns the same promise', async () => {
    const promise = Promise.reject(new Error('failed'));

    expect(handled(promise)).toBe(promise);
    await expect(promise).rejects.toThrow('failed');
  });
});
