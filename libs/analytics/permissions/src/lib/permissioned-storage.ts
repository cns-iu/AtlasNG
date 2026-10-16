/**
 * Key under which the `analytics` package reads and writes the anonymous ID.
 */
export const ANONYMOUS_ID_KEY = '__anon_id';

/**
 * `sessionStorage` key used to keep the anonymous ID once consent is granted.
 */
export const ANONYMOUS_ID_SESSION_STORAGE_KEY = '__atlasng_analytics_anon_id__';

/**
 * Storage adapter accepted by the `analytics` package through its `storage` option.
 */
export interface ConsentStorage {
  /**
   * Reads a value.
   *
   * @param key Storage key
   * @returns The stored value, or `null` when missing
   */
  getItem(key: string): unknown;

  /**
   * Writes a value.
   *
   * @param key Storage key
   * @param value Value to store
   */
  setItem(key: string, value: unknown): void;

  /**
   * Removes a value.
   *
   * @param key Storage key
   */
  removeItem(key: string): void;

  /**
   * Moves the anonymous ID between memory and `sessionStorage` to match the current consent.
   * Called automatically on every access; call it directly to react to consent changes promptly.
   */
  sync(): void;
}

/**
 * Creates the storage adapter used by the default backend.
 *
 * Nothing is ever written to `localStorage` or cookies:
 * - The anonymous ID is generated and owned by the adapter. Writes to
 *   {@link ANONYMOUS_ID_KEY} are ignored, so the `an_aid` URL parameter
 *   can't replace it.
 * - Until `hasConsent` returns `true`, the anonymous ID is kept in memory only.
 *   Once it returns `true`, the ID moves to `sessionStorage`. When consent is
 *   revoked, the ID is removed from `sessionStorage` and kept in memory again.
 * - All other keys (such as the user ID and traits) are kept in memory only.
 *
 * Methods are closures, because the `analytics` package calls them unbound.
 *
 * @param sessionStorage Session storage, or `undefined` when unavailable (for example on the server)
 * @param hasConsent Returns whether the anonymous ID may be kept in `sessionStorage`
 * @param generateId Creates a new anonymous ID
 * @returns Storage adapter for the `analytics` package
 */
export function createConsentStorage(
  sessionStorage: Storage | undefined,
  hasConsent: () => boolean,
  generateId: () => string = generateAnonymousId,
): ConsentStorage {
  const memory = new Map<string, unknown>();
  let memoryId: string | undefined;
  let persisted = !!sessionStorage && hasConsent();

  if (!persisted) {
    // Clear an ID left behind by an earlier page load whose consent has since been revoked
    safeRemove(sessionStorage);
  }

  /**
   * Reads the anonymous ID from its current location.
   *
   * @returns The anonymous ID, or `undefined` when none has been created
   */
  const readId = (): string | undefined => (persisted ? safeGet(sessionStorage) : undefined) ?? memoryId;

  /**
   * Writes the anonymous ID to its current location, falling back to memory when storage fails.
   *
   * @param id Anonymous ID to store
   */
  const writeId = (id: string): void => {
    memoryId = persisted && safeSet(sessionStorage, id) ? undefined : id;
  };

  /** Moves the anonymous ID between memory and session storage when consent changes. */
  const sync = (): void => {
    const shouldPersist = !!sessionStorage && hasConsent();
    if (shouldPersist === persisted) {
      return;
    }

    const id = readId();
    if (persisted) {
      safeRemove(sessionStorage);
    }

    persisted = shouldPersist;
    memoryId = undefined;
    if (id) {
      writeId(id);
    }
  };

  return {
    sync,
    getItem: (key) => {
      sync();
      if (key !== ANONYMOUS_ID_KEY) {
        return memory.get(key) ?? null;
      }

      let id = readId();
      if (!id) {
        id = generateId();
        writeId(id);
      }
      return id;
    },
    setItem: (key, value) => {
      sync();
      if (key !== ANONYMOUS_ID_KEY) {
        memory.set(key, value);
      }
    },
    removeItem: (key) => {
      sync();
      if (key !== ANONYMOUS_ID_KEY) {
        memory.delete(key);
      } else {
        memoryId = undefined;
        safeRemove(sessionStorage);
      }
    },
  };
}

/**
 * Generates a random anonymous ID.
 * Uses `crypto.getRandomValues`, which, unlike `crypto.randomUUID`, also works outside secure contexts.
 *
 * @returns A 32 character hexadecimal ID
 */
function generateAnonymousId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Reads the anonymous ID from session storage, ignoring storage errors.
 *
 * @param storage Session storage
 * @returns The stored ID, or `undefined` when missing or unreadable
 */
function safeGet(storage: Storage | undefined): string | undefined {
  try {
    return storage?.getItem(ANONYMOUS_ID_SESSION_STORAGE_KEY) || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Writes the anonymous ID to session storage, ignoring storage errors.
 *
 * @param storage Session storage
 * @param id Anonymous ID
 * @returns `true` when the ID was written
 */
function safeSet(storage: Storage | undefined, id: string): boolean {
  try {
    storage?.setItem(ANONYMOUS_ID_SESSION_STORAGE_KEY, id);
    return !!storage;
  } catch {
    return false;
  }
}

/**
 * Removes the anonymous ID from session storage, ignoring storage errors.
 *
 * @param storage Session storage
 */
function safeRemove(storage: Storage | undefined): void {
  try {
    storage?.removeItem(ANONYMOUS_ID_SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}
