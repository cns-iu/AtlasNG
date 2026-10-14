import { DestroyRef, inject, InjectionToken, Provider, Service, signal } from '@angular/core';
import { createConfigurationToken, LOCAL_STORAGE, type, WINDOW } from '@atlasng/core';
import { AnalyticsPermissions } from './permissions';

/**
 * Configuration for {@link AnalyticsPermissionsManager}.
 */
export interface AnalyticsPermissionsManagerConfig {
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

/** Permission manager configuration. */
const ANALYTICS_PERMISSIONS_CONFIG = createConfigurationToken({
  name: 'ANALYTICS_PERMISSIONS_CONFIG',
  config: type<AnalyticsPermissionsManagerConfig>(),
  defaults: () => ({
    changeEventName: 'atlasng:analytics:permissions-change',
    storage: inject(LOCAL_STORAGE) ?? false,
    storageKey: '__atlasng_analytics_permissions__',
    storageEvents: true,
  }),
});

/**
 * Provides configuration for {@link AnalyticsPermissionsManager}.
 *
 * @param config Partial manager configuration.
 * @returns Provider entry for the config token.
 */
export const provideAnalyticsPermissionsManagerConfig = ANALYTICS_PERMISSIONS_CONFIG.provide;

/**
 * Initial permissions for {@link AnalyticsPermissionsManager}.
 */
const INITIAL_ANALYTICS_PERMISSIONS = new InjectionToken<AnalyticsPermissions>('ANALYTICS_PERMISSIONS', {
  providedIn: 'root',
  factory: () => AnalyticsPermissions.DEFAULT,
});

/**
 * Provides initial permissions for {@link AnalyticsPermissionsManager}.
 *
 * @param permissions Initial permissions to set.
 * @returns Provider entry for the initial permissions.
 */
export function provideInitialAnalyticsPermissions(permissions: AnalyticsPermissions): Provider {
  return {
    provide: INITIAL_ANALYTICS_PERMISSIONS,
    useValue: permissions,
  };
}

/**
 * Manages active analytics permissions.
 *
 * By default permissions are persisted to {@link localStorage} and
 * synchronized across browser contexts through storage and custom events.
 * This behavior can be customized through the manager configuration.
 */
@Service()
export class AnalyticsPermissionsManager {
  /** Resolved manager configuration with defaults applied. */
  readonly config = ANALYTICS_PERMISSIONS_CONFIG.inject();

  /** Window abstraction used for browser event wiring, or `undefined` when no window is available. */
  readonly #window = inject(WINDOW);

  /** Permissions used until a decision is loaded or made, and after a stored decision is removed. */
  readonly #initialPermissions = inject(INITIAL_ANALYTICS_PERMISSIONS);

  /**
   * Writable permission state signal.
   * Compares values with {@link AnalyticsPermissions.equals} so equal updates don't notify consumers.
   */
  readonly #permissions = signal(this.#initialPermissions, { equal: (a, b) => a.equals(b) });

  /** Writable decision state signal. */
  readonly #decided = signal(false);

  /** Current permissions. */
  readonly permissions = this.#permissions.asReadonly();

  /**
   * Whether the user has made a consent decision.
   *
   * `true` once permissions are loaded from storage, set through this manager,
   * or received from another tab or application. It returns to `false` when the
   * stored decision is removed in another tab. Use it to decide whether to show
   * a cookie banner.
   */
  readonly decided = this.#decided.asReadonly();

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
  setPermissions(permissions: AnalyticsPermissions): void {
    this.updatePermissions(() => permissions);
  }

  /** Sets the default permissions preset. */
  setDefaultPermissions(): void {
    this.setPermissions(AnalyticsPermissions.DEFAULT);
  }

  /** Sets the full permissions preset. */
  setFullPermissions(): void {
    this.setPermissions(AnalyticsPermissions.FULL);
  }

  /**
   * Updates the active permissions through a callback and broadcasts the change.
   * The result is always recorded as a decision, even when it equals the current permissions,
   * so choosing the defaults (for example "necessary only") is persisted too.
   *
   * @param updater Callback that receives the current permissions and returns the new permissions.
   */
  updatePermissions(updater: (permissions: AnalyticsPermissions) => AnalyticsPermissions): void {
    const permissions = this.#permissions();
    const newPermissions = updater(permissions);
    if (newPermissions.equals(permissions) && this.#decided()) {
      return;
    }

    this.#permissions.set(newPermissions);
    this.#decided.set(true);
    this.#broadcastPermissionsChange();
    this.syncToStorage();
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

    let storedPermissions: string | null = null;
    try {
      storedPermissions = storage.getItem(storageKey);
    } catch {
      // Ignore storage errors (e.g. access denied)
    }

    const newPermissions = AnalyticsPermissions.tryFromJSON(storedPermissions ?? '');
    if (!newPermissions) {
      return false;
    }

    this.#permissions.set(newPermissions);
    this.#decided.set(true);
    if (broadcastChange) {
      this.#broadcastPermissionsChange();
    }

    return true;
  }

  /** Registers and tears down browser listeners for permission synchronization. Does nothing without a window. */
  #initializePermissionsChangeListeners(): void {
    const window = this.#window;
    if (!window) {
      return;
    }

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

  /** Broadcasts the current permissions through the configured custom event. Does nothing without a window. */
  #broadcastPermissionsChange(): void {
    const { changeEventName } = this.config;
    if (!changeEventName || !this.#window) {
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
      // A null key means the whole storage area was cleared
      if (event.storageArea !== storage || (event.key !== null && event.key !== storageKey)) {
        return;
      } else if (event.newValue === null) {
        this.#resetDecision();
        return;
      }

      value = event.newValue;
    } else if (event instanceof CustomEvent) {
      value = event.detail;
    }

    const newPermissions = typeof value === 'string' && AnalyticsPermissions.tryFromJSON(value, this.#permissions());
    if (newPermissions) {
      this.#permissions.set(newPermissions);
      this.#decided.set(true);
    }
  }

  /** Restores the initial permissions after the stored decision was removed in another browser context. */
  #resetDecision(): void {
    this.#permissions.set(this.#initialPermissions);
    this.#decided.set(false);
  }
}
