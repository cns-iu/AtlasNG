import { isStorageAvailable, SafeStorage } from './storage';

describe('isStorageAvailable', () => {
  function createStorage(overrides: Partial<Storage> = {}): Storage {
    return {
      length: 0,
      clear: vi.fn(),
      getItem: vi.fn(),
      key: vi.fn(),
      removeItem: vi.fn(),
      setItem: vi.fn(),
      ...overrides,
    } as Storage;
  }

  it('should return true when storage supports write and remove operations', () => {
    const storage = createStorage();

    expect(isStorageAvailable(() => storage)).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith('__atlasng_storage_test__', '__atlasng_storage_test__');
    expect(storage.removeItem).toHaveBeenCalledWith('__atlasng_storage_test__');
  });

  it('should return false when storage throws a non-quota error', () => {
    const storage = createStorage({
      setItem: vi.fn(() => {
        throw new Error('storage unavailable');
      }),
    });

    expect(isStorageAvailable(() => storage)).toBe(false);
  });

  it('should return true when quota is exceeded but storage already contains data', () => {
    const storage = createStorage({
      length: 1,
      setItem: vi.fn(() => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      }),
    });

    expect(isStorageAvailable(() => storage)).toBe(true);
  });

  it('should return false when quota is exceeded and storage is empty', () => {
    const storage = createStorage({
      setItem: vi.fn(() => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      }),
    });

    expect(isStorageAvailable(() => storage)).toBe(false);
  });
});

describe('SafeStorage', () => {
  function createStorage(initial?: Record<string, string>): Storage {
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

  function createThrowingStorage(): Storage {
    const fail = () => {
      throw new DOMException('Storage failure', 'SecurityError');
    };

    return {
      get length(): number {
        return fail();
      },
      clear: vi.fn(fail),
      getItem: vi.fn(fail),
      key: vi.fn(fail),
      removeItem: vi.fn(fail),
      setItem: vi.fn(fail),
    } as Storage;
  }

  it('should delegate to the wrapped storage', () => {
    const storage = createStorage({ existing: 'value' });
    const safe = new SafeStorage(storage);

    expect(safe.available).toBe(true);
    expect(safe.getItem('existing')).toBe('value');
    expect(safe.getItem('missing')).toBeNull();
    expect(safe.setItem('added', 'other')).toBe(true);
    expect(safe.length).toBe(2);
    expect(safe.key(1)).toBe('added');
    expect(safe.key(2)).toBeNull();
    expect(safe.removeItem('existing')).toBe(true);
    expect(storage.getItem('existing')).toBeNull();
    expect(safe.clear()).toBe(true);
    expect(storage.length).toBe(0);
  });

  it('should return empty results and fail writes when storage is unavailable', () => {
    const safe = new SafeStorage(undefined);

    expect(safe.available).toBe(false);
    expect(safe.length).toBe(0);
    expect(safe.key(0)).toBeNull();
    expect(safe.getItem('key')).toBeNull();
    expect(safe.setItem('key', 'value')).toBe(false);
    expect(safe.removeItem('key')).toBe(false);
    expect(safe.clear()).toBe(false);
  });

  it('should catch errors thrown by the wrapped storage', () => {
    const safe = new SafeStorage(createThrowingStorage());

    expect(safe.available).toBe(true);
    expect(safe.length).toBe(0);
    expect(safe.key(0)).toBeNull();
    expect(safe.getItem('key')).toBeNull();
    expect(safe.setItem('key', 'value')).toBe(false);
    expect(safe.removeItem('key')).toBe(false);
    expect(safe.clear()).toBe(false);
  });
});
