import { isStorageAvailable } from './storage';

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
