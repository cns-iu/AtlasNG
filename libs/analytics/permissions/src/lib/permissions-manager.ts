import { DestroyRef, inject, Injectable, InjectionToken, Provider, signal } from '@angular/core';
import { LOCAL_STORAGE, WINDOW } from '@atlasng/core';
import { Permissions } from './permissions';

/**
 * Configuration for {@link PermissionsManager}.
 */
export interface PermissionsManagerConfig {
  /**
   * Name of the custom browser event used to broadcast permission changes.
   * Set to `false` to disable custom-event synchronization.
   */
  changeEventName?: string | false;

  /**
   * Storage backend used for persistence.
   * Set to `false` to disable persistence.
   */
  storage?: Storage | false;

  /**
   * Storage key used when reading and writing permissions.
   */
  storageKey?: string;

  /**
   * Whether `storage` events should be observed for cross-tab synchronization.
   */
  storageEvents?: boolean;
}

/** Injection token for {@link PermissionsManagerConfig}. */
const PERMISSIONS_CONFIG = new InjectionToken<PermissionsManagerConfig>('PERMISSIONS_CONFIG', {
  providedIn: 'root',
  factory: () => ({}),
});

/**
 * Provides configuration for {@link PermissionsManager}.
 *
 * @param config Partial manager configuration.
 * @returns Angular provider entry for the config token.
 */
export function providePermissionsManagerConfig(config: PermissionsManagerConfig): Provider {
  return {
    provide: PERMISSIONS_CONFIG,
    useValue: config,
  };
}

/**
 * Injects manager configuration and resolves all default values.
 *
 * @returns A fully populated manager configuration object.
 */
function injectPermissionsManagerConfigWithDefaults(): Required<PermissionsManagerConfig> {
  const config = inject(PERMISSIONS_CONFIG);
  return {
    changeEventName: config.changeEventName ?? 'atlasng:analytics:permissions-change',
    storage: config.storage ?? inject(LOCAL_STORAGE) ?? false,
    storageKey: config.storageKey ?? '__atlasng_analytics_permissions__',
    storageEvents: config.storageEvents ?? true,
  };
}

/**
 * Manages active analytics permissions.
 *
 * By default permissions are persisted to {@link localStorage} and
 * synchronized across browser contexts through storage and custom events.
 * This behavior can be customized through the manager configuration.
 */
@Injectable({
  providedIn: 'root',
})
export class PermissionsManager {
  /** Window abstraction used for browser event wiring. */
  readonly #window = inject(WINDOW);

  /** Resolved manager configuration with defaults applied. */
  readonly config = injectPermissionsManagerConfigWithDefaults();

  /** Writable permission state signal. */
  readonly #permissions = signal(Permissions.DEFAULT);

  /** Current permissions. */
  readonly permissions = this.#permissions.asReadonly();

  /** Initializes event listeners and attempts initial storage sync. */
  constructor() {
    this.#initializePermissionsChangeListeners();
    this.syncFromStorage(false);
  }

  /**
   * Sets the active permissions and broadcast the change.
   *
   * @param permissions Permissions to set.
   */
  setPermissions(permissions: Permissions): void {
    this.#permissions.set(permissions);
    this.#broadcastPermissionsChange();
    this.syncToStorage();
  }

  /** Sets the default permissions preset. */
  setDefaultPermissions(): void {
    this.setPermissions(Permissions.DEFAULT);
  }

  /** Sets the full permissions preset. */
  setFullPermissions(): void {
    this.setPermissions(Permissions.FULL);
  }

  /**
   * Persists current permissions to the configured storage backend.
   *
   * @returns `true` when permissions were written, otherwise `false`.
   */
  syncToStorage(): boolean {
    const { storage, storageKey } = this.config;
    if (!storage) {
      return false;
    }

    try {
      storage.setItem(storageKey, JSON.stringify(this.permissions()));
      return true;
    } catch {
      // Ignore storage errors (e.g. quota exceeded)
      return false;
    }
  }

  /**
   * Reads permissions from storage and applies them when valid.
   *
   * @param broadcastChange Whether to broadcast the applied change.
   * @returns `true` when permissions were loaded and applied, otherwise `false`.
   */
  syncFromStorage(broadcastChange = true): boolean {
    const { storage, storageKey } = this.config;
    if (!storage) {
      return false;
    }

    const storedPermissions = storage.getItem(storageKey) ?? '';
    const newPermissions = Permissions.tryFromJSON(storedPermissions);
    if (!newPermissions) {
      return false;
    }

    this.#permissions.set(newPermissions);
    if (broadcastChange) {
      this.#broadcastPermissionsChange();
    }

    return true;
  }

  /** Registers and tears down browser listeners for permission synchronization. */
  #initializePermissionsChangeListeners(): void {
    const window = this.#window;
    const { changeEventName, storage, storageEvents } = this.config;
    const handler = this.#onPermissionsChange.bind(this);
    const destroyRef = inject(DestroyRef);

    if (changeEventName) {
      window.addEventListener(changeEventName, handler);
      destroyRef.onDestroy(() => window.removeEventListener(changeEventName, handler));
    }

    if (storage && storageEvents) {
      window.addEventListener('storage', handler);
      destroyRef.onDestroy(() => window.removeEventListener('storage', handler));
    }
  }

  /** Broadcasts the current permissions through the configured custom event. */
  #broadcastPermissionsChange(): void {
    const { changeEventName } = this.config;
    if (!changeEventName) {
      return;
    }

    const permissions = JSON.stringify(this.permissions());
    const event = new CustomEvent(changeEventName, { detail: permissions });
    this.#window.dispatchEvent(event);
  }

  /**
   * Handles incoming storage/custom events and updates local permissions when possible.
   *
   * @param event Browser event carrying potential permission data.
   */
  #onPermissionsChange(event: Event): void {
    let value: unknown;
    if (event instanceof StorageEvent) {
      const { storage, storageKey } = this.config;
      if (event.storageArea === storage && event.key === storageKey) {
        value = event.newValue;
      }
    } else if (event instanceof CustomEvent) {
      value = event.detail;
    }

    if (typeof value === 'string') {
      this.#permissions.update((current) => {
        const newPermissions = Permissions.tryFromJSON(value, current);
        return newPermissions ?? current;
      });
    }
  }
}
