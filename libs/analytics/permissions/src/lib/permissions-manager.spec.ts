import { TestBed } from '@angular/core/testing';
import { AnalyticsEventCategory } from '@atlasng/analytics/events';
import { LOCAL_STORAGE, WINDOW } from '@atlasng/core';
import { Permissions } from './permissions';
import { PermissionsManager, providePermissionsManagerConfig } from './permissions-manager';

describe('PermissionsManager', () => {
  const DEFAULT_CHANGE_EVENT_NAME = 'atlasng:analytics:permissions-change';
  const DEFAULT_STORAGE_KEY = '__atlasng_analytics_permissions__';

  function createStorage(initial?: Record<string, string>): Storage {
    const data = new Map(Object.entries(initial ?? {}));

    return {
      get length() {
        return data.size;
      },
      clear: vi.fn(() => {
        data.clear();
      }),
      getItem: vi.fn((key: string) => data.get(key) ?? null),
      key: vi.fn((index: number) => Array.from(data.keys())[index] ?? null),
      removeItem: vi.fn((key: string) => {
        data.delete(key);
      }),
      setItem: vi.fn((key: string, value: string) => {
        data.set(key, value);
      }),
    } as Storage;
  }

  function setup(options?: {
    storage?: Storage | false;
    config?: Parameters<typeof providePermissionsManagerConfig>[0];
  }) {
    const storage = options?.storage ?? createStorage();
    const fakeWindow = new EventTarget() as Window;

    TestBed.configureTestingModule({
      providers: [
        { provide: WINDOW, useValue: fakeWindow },
        { provide: LOCAL_STORAGE, useValue: storage === false ? undefined : storage },
        ...(options?.config ? [providePermissionsManagerConfig(options.config)] : []),
      ],
    });

    const manager = TestBed.inject(PermissionsManager);
    return { manager, fakeWindow, storage };
  }

  function getChangeEventName(manager: PermissionsManager): string {
    const eventName = manager.config.changeEventName;
    if (!eventName) {
      throw new Error('Expected changeEventName to be enabled for this test');
    }
    return eventName;
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('resolves default config values', () => {
    const storage = createStorage();
    const { manager } = setup({ storage });

    expect(manager.config.changeEventName).toBe(DEFAULT_CHANGE_EVENT_NAME);
    expect(manager.config.storage).toBe(storage);
    expect(manager.config.storageKey).toBe(DEFAULT_STORAGE_KEY);
    expect(manager.config.storageEvents).toBe(true);
  });

  it('falls back to false when config storage and injected local storage are unavailable', () => {
    const { manager } = setup({ storage: false });

    expect(manager.config.storage).toBe(false);
  });

  it('sets permissions, broadcasts change event, and syncs to storage', () => {
    const storage = createStorage();
    const { manager, fakeWindow } = setup({ storage });
    const changeEventName = getChangeEventName(manager);

    const eventSpy = vi.fn();
    fakeWindow.addEventListener(changeEventName, eventSpy);

    manager.setPermissions(Permissions.FULL);

    expect(manager.permissions().equals(Permissions.FULL)).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith(manager.config.storageKey, JSON.stringify(Permissions.FULL));
    expect(eventSpy).toHaveBeenCalledTimes(1);

    const event = eventSpy.mock.calls[0]?.[0] as CustomEvent;
    expect(event.detail).toBe(JSON.stringify(Permissions.FULL));
  });

  it('applies default and full presets', () => {
    const { manager } = setup();

    manager.setFullPermissions();
    expect(manager.permissions().equals(Permissions.FULL)).toBe(true);

    manager.setDefaultPermissions();
    expect(manager.permissions().equals(Permissions.DEFAULT)).toBe(true);
  });

  it('returns false when syncing to storage is disabled', () => {
    const { manager } = setup({ storage: false, config: { storage: false } });

    expect(manager.syncToStorage()).toBe(false);
  });

  it('returns false when syncing to storage throws', () => {
    const storage = createStorage();
    vi.mocked(storage.setItem).mockImplementationOnce(() => {
      throw new Error('quota exceeded');
    });

    const { manager } = setup({ storage });

    expect(manager.syncToStorage()).toBe(false);
  });

  it('loads permissions from storage on initialization without broadcasting', () => {
    const loaded = Permissions.DEFAULT.enableCategory(AnalyticsEventCategory.Statistics);
    const storage = createStorage({
      [DEFAULT_STORAGE_KEY]: JSON.stringify(loaded),
    });
    const fakeWindow = new EventTarget() as Window;
    const eventSpy = vi.fn();
    fakeWindow.addEventListener(DEFAULT_CHANGE_EVENT_NAME, eventSpy);

    TestBed.configureTestingModule({
      providers: [
        { provide: WINDOW, useValue: fakeWindow },
        { provide: LOCAL_STORAGE, useValue: storage },
      ],
    });

    const manager = TestBed.inject(PermissionsManager);

    expect(manager.permissions().isCategoryEnabled(AnalyticsEventCategory.Statistics)).toBe(true);
    expect(eventSpy).not.toHaveBeenCalled();
  });

  it('syncFromStorage broadcasts by default when new permissions are applied', () => {
    const storage = createStorage();
    const { manager, fakeWindow } = setup({ storage });
    const changeEventName = getChangeEventName(manager);

    const loaded = Permissions.DEFAULT.enableCategory(AnalyticsEventCategory.Marketing);
    storage.setItem(manager.config.storageKey, JSON.stringify(loaded));

    const eventSpy = vi.fn();
    fakeWindow.addEventListener(changeEventName, eventSpy);

    expect(manager.syncFromStorage()).toBe(true);
    expect(manager.permissions().isCategoryEnabled(AnalyticsEventCategory.Marketing)).toBe(true);
    expect(eventSpy).toHaveBeenCalledTimes(1);
  });

  it('returns false when syncFromStorage cannot parse persisted permissions', () => {
    const storage = createStorage({ [DEFAULT_STORAGE_KEY]: 'invalid-json' });
    const { manager } = setup({ storage });

    const before = manager.permissions();

    expect(manager.syncFromStorage()).toBe(false);
    expect(manager.permissions().equals(before)).toBe(true);
  });

  it('updates permissions from incoming custom events', () => {
    const { manager, fakeWindow } = setup();
    const changeEventName = getChangeEventName(manager);

    const payload = JSON.stringify(Permissions.DEFAULT.enableCategory(AnalyticsEventCategory.Preferences));
    fakeWindow.dispatchEvent(new CustomEvent(changeEventName, { detail: payload }));

    expect(manager.permissions().isCategoryEnabled(AnalyticsEventCategory.Preferences)).toBe(true);
  });

  it('does not broadcast or react to custom events when change events are disabled', () => {
    const { manager, fakeWindow } = setup({
      storage: false,
      config: { changeEventName: false, storage: false },
    });

    const before = manager.permissions();
    manager.setPermissions(Permissions.FULL);

    fakeWindow.dispatchEvent(
      new CustomEvent(DEFAULT_CHANGE_EVENT_NAME, {
        detail: JSON.stringify(Permissions.DEFAULT.enableCategory(AnalyticsEventCategory.Marketing)),
      }),
    );

    expect(manager.permissions().equals(Permissions.FULL)).toBe(true);
    expect(before.equals(Permissions.DEFAULT)).toBe(true);
  });

  it('ignores non-custom and non-storage events', () => {
    const { manager, fakeWindow } = setup();
    const changeEventName = getChangeEventName(manager);

    const before = manager.permissions();
    fakeWindow.dispatchEvent(new Event(changeEventName));

    expect(manager.permissions().equals(before)).toBe(true);
  });

  it('keeps current permissions when a custom event payload is invalid JSON', () => {
    const { manager, fakeWindow } = setup();
    const changeEventName = getChangeEventName(manager);

    manager.setPermissions(Permissions.FULL);
    fakeWindow.dispatchEvent(new CustomEvent(changeEventName, { detail: 'not-json' }));

    expect(manager.permissions().equals(Permissions.FULL)).toBe(true);
  });

  it('updates permissions from matching storage events only', () => {
    const storage = window.localStorage;
    storage.removeItem(DEFAULT_STORAGE_KEY);

    const { manager, fakeWindow } = setup({ storage });

    const otherStorage = window.sessionStorage;
    const payload = JSON.stringify(Permissions.DEFAULT.enableCategory(AnalyticsEventCategory.Marketing));

    fakeWindow.dispatchEvent(
      new StorageEvent('storage', {
        key: 'other-key',
        newValue: payload,
        storageArea: storage,
      }),
    );

    expect(manager.permissions().isCategoryEnabled(AnalyticsEventCategory.Marketing)).toBe(false);

    fakeWindow.dispatchEvent(
      new StorageEvent('storage', {
        key: manager.config.storageKey,
        newValue: payload,
        storageArea: otherStorage,
      }),
    );

    expect(manager.permissions().isCategoryEnabled(AnalyticsEventCategory.Marketing)).toBe(false);

    fakeWindow.dispatchEvent(
      new StorageEvent('storage', {
        key: manager.config.storageKey,
        newValue: payload,
        storageArea: storage,
      }),
    );

    expect(manager.permissions().isCategoryEnabled(AnalyticsEventCategory.Marketing)).toBe(true);

    storage.removeItem(manager.config.storageKey);
  });
});
