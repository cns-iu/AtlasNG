import { ANONYMOUS_ID_KEY, ANONYMOUS_ID_SESSION_STORAGE_KEY, createConsentStorage } from './consent-storage';

describe('createConsentStorage', () => {
  function createSessionStorage(initial?: Record<string, string>): Storage {
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

  function setup(options: { consent?: boolean; session?: Record<string, string>; sessionStorage?: Storage } = {}) {
    let consent = options.consent ?? false;
    let counter = 0;
    const sessionStorage = options.sessionStorage ?? createSessionStorage(options.session);
    const storage = createConsentStorage(
      sessionStorage,
      () => consent,
      () => `id-${++counter}`,
    );
    const setConsent = (value: boolean) => {
      consent = value;
    };
    return { storage, sessionStorage, setConsent };
  }

  it('keeps the anonymous ID in memory before consent', () => {
    const { storage, sessionStorage } = setup();

    expect(storage.getItem(ANONYMOUS_ID_KEY)).toBe('id-1');
    expect(storage.getItem(ANONYMOUS_ID_KEY)).toBe('id-1');
    expect(sessionStorage.setItem).not.toHaveBeenCalled();
  });

  it('removes a leftover session ID when created without consent', () => {
    const { storage, sessionStorage } = setup({ session: { [ANONYMOUS_ID_SESSION_STORAGE_KEY]: 'stale' } });

    expect(sessionStorage.getItem(ANONYMOUS_ID_SESSION_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(ANONYMOUS_ID_KEY)).toBe('id-1');
  });

  it('reuses the session ID when consent was already granted', () => {
    const { storage } = setup({ consent: true, session: { [ANONYMOUS_ID_SESSION_STORAGE_KEY]: 'existing' } });

    expect(storage.getItem(ANONYMOUS_ID_KEY)).toBe('existing');
  });

  it('writes new IDs to session storage when consent is granted', () => {
    const { storage, sessionStorage } = setup({ consent: true });

    expect(storage.getItem(ANONYMOUS_ID_KEY)).toBe('id-1');
    expect(sessionStorage.getItem(ANONYMOUS_ID_SESSION_STORAGE_KEY)).toBe('id-1');
  });

  it('moves the ID to session storage when consent is granted and back when revoked', () => {
    const { storage, sessionStorage, setConsent } = setup();
    const id = storage.getItem(ANONYMOUS_ID_KEY);

    setConsent(true);
    storage.sync();
    expect(sessionStorage.getItem(ANONYMOUS_ID_SESSION_STORAGE_KEY)).toBe(id);
    expect(storage.getItem(ANONYMOUS_ID_KEY)).toBe(id);

    setConsent(false);
    storage.sync();
    expect(sessionStorage.getItem(ANONYMOUS_ID_SESSION_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(ANONYMOUS_ID_KEY)).toBe(id);
  });

  it('does not write to session storage until an ID is needed', () => {
    const { storage, sessionStorage, setConsent } = setup();

    setConsent(true);
    storage.sync();
    expect(sessionStorage.setItem).not.toHaveBeenCalled();

    expect(storage.getItem(ANONYMOUS_ID_KEY)).toBe('id-1');
    expect(sessionStorage.getItem(ANONYMOUS_ID_SESSION_STORAGE_KEY)).toBe('id-1');
  });

  it('ignores writes to the anonymous ID', () => {
    const { storage } = setup();
    const id = storage.getItem(ANONYMOUS_ID_KEY);

    storage.setItem(ANONYMOUS_ID_KEY, 'from-url');

    expect(storage.getItem(ANONYMOUS_ID_KEY)).toBe(id);
  });

  it('creates a new ID after the anonymous ID is removed', () => {
    const { storage, sessionStorage } = setup({ consent: true });
    storage.getItem(ANONYMOUS_ID_KEY);

    storage.removeItem(ANONYMOUS_ID_KEY);

    expect(sessionStorage.getItem(ANONYMOUS_ID_SESSION_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(ANONYMOUS_ID_KEY)).toBe('id-2');
  });

  it('keeps other keys in memory only', () => {
    const { storage, sessionStorage } = setup({ consent: true });

    expect(storage.getItem('__user_id')).toBeNull();
    storage.setItem('__user_id', 'user');
    expect(storage.getItem('__user_id')).toBe('user');
    storage.removeItem('__user_id');
    expect(storage.getItem('__user_id')).toBeNull();
    expect(sessionStorage.setItem).not.toHaveBeenCalledWith('__user_id', expect.anything());
  });

  it('keeps the ID in memory without session storage', () => {
    const storage = createConsentStorage(undefined, () => true);

    const id = storage.getItem(ANONYMOUS_ID_KEY);

    expect(id).toMatch(/^[0-9a-f]{32}$/);
    expect(storage.getItem(ANONYMOUS_ID_KEY)).toBe(id);
  });

  it('falls back to memory when session storage throws', () => {
    const sessionStorage = createSessionStorage();
    vi.mocked(sessionStorage.getItem).mockImplementation(() => {
      throw new Error('denied');
    });
    vi.mocked(sessionStorage.setItem).mockImplementation(() => {
      throw new Error('denied');
    });
    vi.mocked(sessionStorage.removeItem).mockImplementation(() => {
      throw new Error('denied');
    });
    const { storage } = setup({ consent: true, sessionStorage });

    expect(storage.getItem(ANONYMOUS_ID_KEY)).toBe('id-1');
    expect(storage.getItem(ANONYMOUS_ID_KEY)).toBe('id-1');
    expect(() => storage.removeItem(ANONYMOUS_ID_KEY)).not.toThrow();
  });
});
