/**
 * Test if the provided storage is available and functional.
 *
 * @param getStorage A function that returns the storage object to test.
 * @returns A boolean indicating whether the storage is available and functional.
 */
export function isStorageAvailable(getStorage: () => Storage): boolean {
  const testKey = '__atlasng_storage_test__';
  let storage: Storage | undefined;

  try {
    storage = getStorage();
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch (error) {
    return !!(error instanceof DOMException && error.name === 'QuotaExceededError' && storage && storage.length !== 0);
  }
}

/**
 * Wraps a {@link Storage} so that its methods never throw.
 *
 * Browsers can throw from storage methods, for example `QuotaExceededError` from `setItem`
 * or errors from a corrupted storage file in Firefox. This adapter catches those errors and
 * reports failures through its return values instead. When no storage is provided, for example
 * during server-side rendering, every read returns an empty result and every write fails.
 */
export class SafeStorage {
  /** Wrapped storage, or `undefined` when unavailable. */
  readonly #storage: Storage | undefined;

  /** Whether a storage backend was provided. */
  get available(): boolean {
    return this.#storage !== undefined;
  }

  /** Number of stored items, or `0` when unavailable or unreadable. */
  get length(): number {
    return this.#run((storage) => storage.length, 0);
  }

  /**
   * Creates a safe storage adapter.
   *
   * @param storage Storage to wrap, or `undefined` when unavailable
   */
  constructor(storage: Storage | undefined) {
    this.#storage = storage;
  }

  /**
   * Returns the key at an index.
   *
   * @param index Index of the key
   * @returns The key, or `null` when out of range, unavailable, or unreadable
   */
  key(index: number): string | null {
    return this.#run((storage) => storage.key(index), null);
  }

  /**
   * Reads a value.
   *
   * @param key Storage key
   * @returns The stored value, or `null` when missing, unavailable, or unreadable
   */
  getItem(key: string): string | null {
    return this.#run((storage) => storage.getItem(key), null);
  }

  /**
   * Writes a value.
   *
   * @param key Storage key
   * @param value Value to store
   * @returns `true` when the value was written, otherwise `false`
   */
  setItem(key: string, value: string): boolean {
    return this.#run((storage) => {
      storage.setItem(key, value);
      return true;
    }, false);
  }

  /**
   * Removes a value.
   *
   * @param key Storage key
   * @returns `true` when the removal succeeded, including when the key was missing, otherwise `false`
   */
  removeItem(key: string): boolean {
    return this.#run((storage) => {
      storage.removeItem(key);
      return true;
    }, false);
  }

  /**
   * Removes all values.
   *
   * @returns `true` when the storage was cleared, otherwise `false`
   */
  clear(): boolean {
    return this.#run((storage) => {
      storage.clear();
      return true;
    }, false);
  }

  /**
   * Runs an operation against the wrapped storage, falling back to a default value on failure.
   *
   * @param operation Operation to run
   * @param defaultValue Value returned when storage is unavailable or the operation throws
   * @returns The operation's result, or `defaultValue` when storage is unavailable or the operation throws
   */
  #run<T>(operation: (storage: Storage) => T, defaultValue: NoInfer<T>): T {
    if (!this.#storage) {
      return defaultValue;
    }

    try {
      return operation(this.#storage);
    } catch {
      return defaultValue;
    }
  }
}
