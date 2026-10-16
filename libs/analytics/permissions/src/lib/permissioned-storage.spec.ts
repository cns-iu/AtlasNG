import { PLATFORM_ID, Provider, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AnalyticsEventCategory } from '@atlasng/analytics/events';
import { LOCAL_STORAGE } from '@atlasng/core';
import {
  AnalyticsPermissionedStorage,
  AnalyticsPermissionedStorageConfig,
  AnalyticsPermissionedStorageKeys,
  provideAnalyticsPermissionedStorageConfig,
  provideAnalyticsPermissionedStorageKeys,
} from './permissioned-storage';
import { AnalyticsPermissions } from './permissions';
import { AnalyticsPermissionsManager } from './permissions-manager';

describe('AnalyticsPermissionedStorage', () => {
  const ID_KEY = '__id';
  const ID_STORAGE_KEY = 'stored-id';
  const { Statistics, Preferences } = AnalyticsEventCategory;

  function createBackingStorage(initial?: Record<string, string>): Storage {
    const data = new Map(Object.entries(initial ?? {}));
    return {
      get length() {
        return data.size;
      },
      clear: vi.fn(() => data.clear()),
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

  function permissionsFor(categories: AnalyticsEventCategory[]): AnalyticsPermissions {
    return categories.reduce(
      (permissions, category) => permissions.enableCategory(category),
      AnalyticsPermissions.DEFAULT,
    );
  }

  function createStorage(options: {
    config?: AnalyticsPermissionedStorageConfig;
    keys?: AnalyticsPermissionedStorageKeys[];
    granted?: AnalyticsEventCategory[];
    providers?: Provider[];
  }) {
    const permissions = signal(permissionsFor(options.granted ?? []));
    TestBed.configureTestingModule({
      providers: [
        { provide: AnalyticsPermissionsManager, useValue: { permissions } },
        ...(options.config ? [provideAnalyticsPermissionedStorageConfig(options.config)] : []),
        ...(options.keys ?? []).map((keys) => provideAnalyticsPermissionedStorageKeys(keys)),
        ...(options.providers ?? []),
      ],
    });

    const storage = TestBed.inject(AnalyticsPermissionedStorage);
    const grant = (...categories: AnalyticsEventCategory[]) => permissions.set(permissionsFor(categories));
    return { storage, grant };
  }

  function setup(options: { consent?: boolean; stored?: Record<string, string>; backingStorage?: Storage } = {}) {
    let counter = 0;
    const backingStorage = options.backingStorage ?? createBackingStorage(options.stored);
    const { storage, grant } = createStorage({
      config: { storage: backingStorage },
      keys: [{ [ID_KEY]: { key: ID_STORAGE_KEY, category: Statistics, generate: () => `id-${++counter}` } }],
      granted: options.consent ? [Statistics] : [],
    });
    const setConsent = (value: boolean) => (value ? grant(Statistics) : grant());
    return { storage, backingStorage, setConsent };
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('keeps a generated value in memory before consent', () => {
    const { storage, backingStorage } = setup();

    expect(storage.getItem(ID_KEY)).toBe('id-1');
    expect(storage.getItem(ID_KEY)).toBe('id-1');
    expect(backingStorage.setItem).not.toHaveBeenCalled();
  });

  it('removes a leftover stored value when created without consent', () => {
    const { storage, backingStorage } = setup({ stored: { [ID_STORAGE_KEY]: '"stale"' } });

    expect(backingStorage.getItem(ID_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(ID_KEY)).toBe('id-1');
  });

  it('reuses the stored value when consent was already granted', () => {
    const { storage } = setup({ consent: true, stored: { [ID_STORAGE_KEY]: '"existing"' } });

    expect(storage.getItem(ID_KEY)).toBe('existing');
  });

  it('reads raw stored strings that are not valid JSON', () => {
    const { storage } = setup({ consent: true, stored: { [ID_STORAGE_KEY]: 'raw-id' } });

    expect(storage.getItem(ID_KEY)).toBe('raw-id');
  });

  it('writes generated values to storage as JSON when consent is granted', () => {
    const { storage, backingStorage } = setup({ consent: true });

    expect(storage.getItem(ID_KEY)).toBe('id-1');
    expect(backingStorage.getItem(ID_STORAGE_KEY)).toBe('"id-1"');
  });

  it('moves the value to storage when consent is granted and back when revoked', () => {
    const { storage, backingStorage, setConsent } = setup();
    const id = storage.getItem(ID_KEY);

    setConsent(true);
    storage.sync();
    expect(backingStorage.getItem(ID_STORAGE_KEY)).toBe(JSON.stringify(id));
    expect(storage.getItem(ID_KEY)).toBe(id);

    setConsent(false);
    storage.sync();
    expect(backingStorage.getItem(ID_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(ID_KEY)).toBe(id);
  });

  it('follows consent changes automatically', () => {
    const { storage, backingStorage, setConsent } = setup();
    const id = storage.getItem(ID_KEY);

    setConsent(true);
    TestBed.tick();

    expect(backingStorage.getItem(ID_STORAGE_KEY)).toBe(JSON.stringify(id));
  });

  it('does not write to storage until a value is needed', () => {
    const { storage, backingStorage, setConsent } = setup();

    setConsent(true);
    storage.sync();
    expect(backingStorage.setItem).not.toHaveBeenCalled();

    expect(storage.getItem(ID_KEY)).toBe('id-1');
    expect(backingStorage.getItem(ID_STORAGE_KEY)).toBe('"id-1"');
  });

  it('ignores writes to keys with a generator', () => {
    const { storage } = setup();
    const id = storage.getItem(ID_KEY);

    storage.setItem(ID_KEY, 'from-url');

    expect(storage.getItem(ID_KEY)).toBe(id);
  });

  it('generates a new value after a key with a generator is removed', () => {
    const { storage, backingStorage } = setup({ consent: true });
    storage.getItem(ID_KEY);

    storage.removeItem(ID_KEY);

    expect(backingStorage.getItem(ID_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(ID_KEY)).toBe('id-2');
  });

  it('keeps unregistered keys in memory only', () => {
    const { storage, backingStorage } = setup({ consent: true });

    expect(storage.getItem('__user_id')).toBeNull();
    storage.setItem('__user_id', 'user');
    expect(storage.getItem('__user_id')).toBe('user');
    storage.removeItem('__user_id');
    expect(storage.getItem('__user_id')).toBeNull();
    expect(backingStorage.setItem).not.toHaveBeenCalledWith('__user_id', expect.anything());
  });

  it('persists writable keys only while their category is granted', () => {
    const backingStorage = createBackingStorage();
    const { storage, grant } = createStorage({
      config: { storage: backingStorage },
      keys: [{ traits: { key: 'stored-traits', category: Preferences } }],
    });
    const traits = { plan: 'free' };

    storage.setItem('traits', traits);
    expect(backingStorage.getItem('stored-traits')).toBeNull();

    grant(Preferences);
    storage.sync();
    expect(backingStorage.getItem('stored-traits')).toBe(JSON.stringify(traits));
    expect(storage.getItem('traits')).toEqual(traits);

    storage.setItem('traits', { plan: 'pro' });
    expect(backingStorage.getItem('stored-traits')).toBe('{"plan":"pro"}');

    storage.setItem('traits', undefined);
    expect(backingStorage.getItem('stored-traits')).toBeNull();
    expect(storage.getItem('traits')).toBeNull();
  });

  it('keeps values that cannot be encoded in memory', () => {
    const backingStorage = createBackingStorage();
    const { storage } = createStorage({
      config: { storage: backingStorage },
      keys: [{ value: { key: 'stored-value', category: Preferences } }],
      granted: [Preferences],
    });
    const circular: Record<string, unknown> = {};
    circular['self'] = circular;

    storage.setItem('value', 'first');
    storage.setItem('value', circular);

    expect(backingStorage.getItem('stored-value')).toBeNull();
    expect(storage.getItem('value')).toBe(circular);
  });

  it('follows each category independently', () => {
    const backingStorage = createBackingStorage();
    const { storage, grant } = createStorage({
      config: { storage: backingStorage },
      keys: [
        {
          stats: { key: 'stored-stats', category: Statistics },
          prefs: { key: 'stored-prefs', category: Preferences },
        },
      ],
      granted: [Statistics],
    });

    storage.setItem('stats', 1);
    storage.setItem('prefs', 2);
    expect(backingStorage.getItem('stored-stats')).toBe('1');
    expect(backingStorage.getItem('stored-prefs')).toBeNull();

    grant(Preferences);
    storage.sync();
    expect(backingStorage.getItem('stored-stats')).toBeNull();
    expect(backingStorage.getItem('stored-prefs')).toBe('2');
    expect(storage.getItem('stats')).toBe(1);
  });

  it('uses a per-key storage override', () => {
    const defaultStorage = createBackingStorage();
    const otherStorage = createBackingStorage();
    const { storage } = createStorage({
      config: { storage: defaultStorage },
      keys: [
        {
          shared: { key: 'stored-shared', category: Statistics },
          other: { key: 'stored-other', category: Statistics, storage: otherStorage },
          memory: { key: 'stored-memory', category: Statistics, storage: false },
        },
      ],
      granted: [Statistics],
    });

    storage.setItem('shared', 'a');
    storage.setItem('other', 'b');
    storage.setItem('memory', 'c');

    expect(defaultStorage.getItem('stored-shared')).toBe('"a"');
    expect(otherStorage.getItem('stored-other')).toBe('"b"');
    expect(defaultStorage.getItem('stored-memory')).toBeNull();
    expect(storage.getItem('memory')).toBe('c');
  });

  it('merges registrations with the last one winning', () => {
    const backingStorage = createBackingStorage();
    const { storage } = createStorage({
      config: { storage: backingStorage },
      keys: [
        { first: { key: 'stored-first', category: Statistics }, shared: { key: 'old', category: Statistics } },
        { shared: { key: 'new', category: Statistics } },
      ],
      granted: [Statistics],
    });

    storage.setItem('first', 1);
    storage.setItem('shared', 2);

    expect(backingStorage.getItem('stored-first')).toBe('1');
    expect(backingStorage.getItem('new')).toBe('2');
    expect(backingStorage.getItem('old')).toBeNull();
  });

  it('keeps everything in memory without registrations', () => {
    const backingStorage = createBackingStorage();
    const { storage } = createStorage({ config: { storage: backingStorage }, granted: [Statistics] });

    storage.setItem('key', 'value');

    expect(storage.getItem('key')).toBe('value');
    expect(backingStorage.setItem).not.toHaveBeenCalled();
  });

  it('defaults to local storage in the browser', () => {
    const backingStorage = createBackingStorage();
    const { storage } = createStorage({
      keys: [{ [ID_KEY]: { key: ID_STORAGE_KEY, category: Statistics, generate: () => 'id' } }],
      granted: [Statistics],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: LOCAL_STORAGE, useValue: backingStorage },
      ],
    });

    storage.getItem(ID_KEY);

    expect(storage.config.storage).toBe(backingStorage);
    expect(backingStorage.getItem(ID_STORAGE_KEY)).toBe('"id"');
  });

  it('does not use local storage on the server', () => {
    const backingStorage = createBackingStorage();
    const { storage } = createStorage({
      keys: [{ [ID_KEY]: { key: ID_STORAGE_KEY, category: Statistics, generate: () => 'id' } }],
      granted: [Statistics],
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: LOCAL_STORAGE, useValue: backingStorage },
      ],
    });

    storage.getItem(ID_KEY);

    expect(storage.config.storage).toBe(false);
    expect(backingStorage.setItem).not.toHaveBeenCalled();
  });

  it('keeps values in memory when storage is disabled', () => {
    const { storage } = createStorage({
      config: { storage: false },
      keys: [{ [ID_KEY]: { key: ID_STORAGE_KEY, category: Statistics, generate: () => 'id' } }],
      granted: [Statistics],
    });

    expect(storage.getItem(ID_KEY)).toBe('id');
    expect(storage.getItem(ID_KEY)).toBe('id');
  });

  it('falls back to memory when storage throws', () => {
    const backingStorage = createBackingStorage();
    vi.mocked(backingStorage.getItem).mockImplementation(() => {
      throw new Error('denied');
    });
    vi.mocked(backingStorage.setItem).mockImplementation(() => {
      throw new Error('denied');
    });
    vi.mocked(backingStorage.removeItem).mockImplementation(() => {
      throw new Error('denied');
    });
    const { storage } = setup({ consent: true, backingStorage });

    expect(storage.getItem(ID_KEY)).toBe('id-1');
    expect(storage.getItem(ID_KEY)).toBe('id-1');
    expect(() => storage.removeItem(ID_KEY)).not.toThrow();
  });

  it('works when its methods are called unbound', () => {
    const { storage } = setup();
    const { getItem, setItem, removeItem, sync } = storage;

    setItem('__user_id', 'user');
    sync();
    expect(getItem('__user_id')).toBe('user');
    removeItem('__user_id');
    expect(getItem('__user_id')).toBeNull();
    expect(getItem(ID_KEY)).toBe('id-1');
  });
});
