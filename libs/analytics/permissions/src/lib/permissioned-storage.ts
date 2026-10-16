import { isPlatformBrowser } from '@angular/common';
import { effect, inject, InjectionToken, PLATFORM_ID, Provider, Service } from '@angular/core';
import { AnalyticsEventCategory } from '@atlasng/analytics/events';
import { createConfigurationToken, LOCAL_STORAGE, SafeStorage, type } from '@atlasng/core';
import { AnalyticsPermissionsManager } from './permissions-manager';

/**
 * Configuration for {@link AnalyticsPermissionedStorage}.
 */
export interface AnalyticsPermissionedStorageConfig {
  /**
   * Storage used for registered keys whose consent category is granted, unless a key sets its own.
   * Defaults to `localStorage` in the browser. Set to `false` to keep all values in memory only.
   */
  storage?: Storage | false;
}

/**
 * Describes how a key of {@link AnalyticsPermissionedStorage} is persisted.
 */
export interface AnalyticsPermissionedStorageKey {
  /** Key under which the value is kept in the backing storage. */
  key: string;

  /** Consent category that must be granted before the value is persisted. */
  category: AnalyticsEventCategory;

  /**
   * Backing storage for this key. Defaults to the configured storage.
   * Set to `false` to keep this key in memory only.
   */
  storage?: Storage | false;

  /**
   * Creates the value the first time it is read.
   * A key with a generator is owned by the storage: writes to it are ignored, and removing it
   * discards the value so the next read creates a new one.
   */
  generate?: () => unknown;
}

/**
 * Persisted keys of {@link AnalyticsPermissionedStorage}, mapped from the key callers read and write.
 */
export type AnalyticsPermissionedStorageKeys = Record<string, AnalyticsPermissionedStorageKey>;

/** Permissioned storage configuration. */
const ANALYTICS_PERMISSIONED_STORAGE_CONFIG = createConfigurationToken({
  name: 'ANALYTICS_PERMISSIONED_STORAGE_CONFIG',
  config: type<AnalyticsPermissionedStorageConfig>(),
  defaults: () => ({
    storage: (isPlatformBrowser(inject(PLATFORM_ID)) && inject(LOCAL_STORAGE)) || false,
  }),
});

/**
 * Provides configuration for {@link AnalyticsPermissionedStorage}.
 *
 * @param config Partial permissioned storage configuration.
 * @returns Provider entry for the config token.
 */
export const provideAnalyticsPermissionedStorageConfig = ANALYTICS_PERMISSIONED_STORAGE_CONFIG.provide;

/** Persisted key registrations, merged in provider order. */
const ANALYTICS_PERMISSIONED_STORAGE_KEYS = new InjectionToken<AnalyticsPermissionedStorageKeys[]>(
  'ANALYTICS_PERMISSIONED_STORAGE_KEYS',
);

/**
 * Registers keys that {@link AnalyticsPermissionedStorage} persists while their consent category is granted.
 * Can be provided multiple times; when the same key is registered more than once, the last registration wins.
 *
 * @param keys Persisted keys, mapped from the key callers read and write.
 * @returns Provider entry for the keys token.
 */
export function provideAnalyticsPermissionedStorageKeys(keys: AnalyticsPermissionedStorageKeys): Provider {
  return { provide: ANALYTICS_PERMISSIONED_STORAGE_KEYS, useValue: keys, multi: true };
}

/** Runtime state of a registered key. */
interface PersistedEntry {
  /** Registration of the key. */
  readonly definition: AnalyticsPermissionedStorageKey;
  /** Backing storage of the key. */
  readonly storage: SafeStorage;
  /** Whether the value currently lives in the backing storage. */
  persisted: boolean;
}

/**
 * Consent-aware storage, for example for the `storage` option of the `analytics` package.
 *
 * - Values of keys registered with {@link provideAnalyticsPermissionedStorageKeys} are persisted
 *   as JSON while their consent category is granted in {@link AnalyticsPermissionsManager}. Until
 *   then, and after consent is revoked, they are kept in memory and removed from the backing storage.
 * - Values of all other keys are kept in memory only.
 * - When a backing storage fails, values fall back to memory.
 *
 * Values follow consent changes automatically.
 * Public methods are bound in the constructor, because the `analytics` package calls them unbound.
 */
@Service()
export class AnalyticsPermissionedStorage {
  /** Resolved storage configuration with defaults applied. */
  readonly config = ANALYTICS_PERMISSIONED_STORAGE_CONFIG.inject();

  /** Current consent permissions. */
  readonly #permissions = inject(AnalyticsPermissionsManager).permissions;

  /** Safe storage adapters, one per backing storage. */
  readonly #safeStorages = new Map<Storage, SafeStorage>();

  /** Shared adapter for keys without a backing storage. */
  readonly #unavailableStorage = new SafeStorage(undefined);

  /** Runtime state of the registered keys. */
  readonly #entries = new Map<string, PersistedEntry>();

  /** In-memory values of unregistered keys and of registered keys that are not persisted. */
  readonly #memory = new Map<string, unknown>();

  /**
   * Binds the public methods, removes values left in storage by an earlier page load
   * whose consent is no longer granted, and starts following consent changes.
   */
  constructor() {
    this.getItem = this.getItem.bind(this);
    this.setItem = this.setItem.bind(this);
    this.removeItem = this.removeItem.bind(this);
    this.sync = this.sync.bind(this);

    const registrations = inject(ANALYTICS_PERMISSIONED_STORAGE_KEYS, { optional: true }) ?? [];
    const keys: AnalyticsPermissionedStorageKeys = Object.assign({}, ...registrations);
    for (const [key, definition] of Object.entries(keys)) {
      const storage = this.#safeStorageFor(definition.storage ?? this.config.storage);
      const entry: PersistedEntry = { definition, storage, persisted: false };
      entry.persisted = this.#shouldPersist(entry);
      if (!entry.persisted) {
        storage.removeItem(definition.key);
      }

      this.#entries.set(key, entry);
    }

    effect(() => this.sync());
  }

  /**
   * Reads a value. Reading a key with a generator creates its value when none exists.
   *
   * @param key Storage key
   * @returns The stored value, or `null` when missing
   */
  getItem(key: string): unknown {
    this.sync();
    const entry = this.#entries.get(key);
    if (!entry) {
      return this.#memory.get(key) ?? null;
    }

    let value = this.#read(key, entry);
    if (value === null && entry.definition.generate) {
      value = entry.definition.generate();
      this.#write(key, entry, value);
    }
    return value;
  }

  /**
   * Writes a value. Writes to keys with a generator are ignored.
   *
   * @param key Storage key
   * @param value Value to store
   */
  setItem(key: string, value: unknown): void {
    this.sync();
    const entry = this.#entries.get(key);
    if (!entry) {
      this.#memory.set(key, value);
    } else if (!entry.definition.generate) {
      this.#write(key, entry, value);
    }
  }

  /**
   * Removes a value. Removing a key with a generator discards its value, so the next read creates a new one.
   *
   * @param key Storage key
   */
  removeItem(key: string): void {
    this.sync();
    this.#memory.delete(key);
    const entry = this.#entries.get(key);
    entry?.storage.removeItem(entry.definition.key);
  }

  /**
   * Moves the values of registered keys between memory and their backing storage to match the current consent.
   * Called automatically on every access; call it directly to react to consent changes promptly.
   */
  sync(): void {
    for (const [key, entry] of this.#entries) {
      const shouldPersist = this.#shouldPersist(entry);
      if (shouldPersist === entry.persisted) {
        continue;
      }

      const value = this.#read(key, entry);
      if (entry.persisted) {
        entry.storage.removeItem(entry.definition.key);
      }

      entry.persisted = shouldPersist;
      this.#memory.delete(key);
      if (value !== null) {
        this.#write(key, entry, value);
      }
    }
  }

  /**
   * Returns the safe adapter for a backing storage, creating it on first use.
   *
   * @param storage Backing storage, or `false` when there is none
   * @returns The shared adapter for the storage
   */
  #safeStorageFor(storage: Storage | false): SafeStorage {
    if (!storage) {
      return this.#unavailableStorage;
    }

    let safeStorage = this.#safeStorages.get(storage);
    if (!safeStorage) {
      safeStorage = new SafeStorage(storage);
      this.#safeStorages.set(storage, safeStorage);
    }
    return safeStorage;
  }

  /**
   * Checks whether a registered key should currently live in its backing storage.
   *
   * @param entry Registered key
   * @returns `true` when the backing storage is available and the key's category is granted
   */
  #shouldPersist(entry: PersistedEntry): boolean {
    return entry.storage.available && this.#permissions().isCategoryEnabled(entry.definition.category);
  }

  /**
   * Reads the value of a registered key from its current location.
   *
   * @param key Storage key
   * @param entry Registered key
   * @returns The value, or `null` when missing
   */
  #read(key: string, entry: PersistedEntry): unknown {
    const stored = entry.persisted ? decode(entry.storage.getItem(entry.definition.key)) : null;
    return stored ?? this.#memory.get(key) ?? null;
  }

  /**
   * Writes the value of a registered key to its current location, falling back to memory
   * when the value can't be encoded or storage fails.
   *
   * @param key Storage key
   * @param entry Registered key
   * @param value Value to store
   */
  #write(key: string, entry: PersistedEntry, value: unknown): void {
    const { key: storageKey } = entry.definition;
    if (value === undefined) {
      this.#memory.delete(key);
      entry.storage.removeItem(storageKey);
      return;
    }

    const json = entry.persisted ? encode(value) : undefined;
    if (json !== undefined && entry.storage.setItem(storageKey, json)) {
      this.#memory.delete(key);
    } else {
      this.#memory.set(key, value);
      if (entry.persisted) {
        // Drop the stale stored value so it doesn't shadow the in-memory one
        entry.storage.removeItem(storageKey);
      }
    }
  }
}

/**
 * Encodes a value for persistence.
 *
 * @param value Value to encode
 * @returns The JSON string, or `undefined` when the value can't be encoded
 */
function encode(value: unknown): string | undefined {
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}

/**
 * Decodes a persisted value.
 *
 * @param raw Raw value from the backing storage
 * @returns The parsed JSON value, the raw string when it isn't valid JSON, or `null` when missing
 */
function decode(raw: string | null): unknown {
  if (raw === null) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}
