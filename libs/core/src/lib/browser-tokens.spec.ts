import { TestBed } from '@angular/core/testing';
import {
  CUSTOM_ELEMENT_REGISTRY,
  DOCUMENT,
  LOCAL_STORAGE,
  LOCATION,
  NAVIGATION,
  RESIZE_OBSERVER,
  SAFE_LOCAL_STORAGE,
  SAFE_SESSION_STORAGE,
  SESSION_STORAGE,
  WINDOW,
} from './browser-tokens';

describe('browser tokens', () => {
  function configureDocument(document: Document): void {
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: document }],
    });
  }

  function createStorage(): Storage {
    return {
      length: 0,
      clear: vi.fn(),
      getItem: vi.fn(),
      key: vi.fn(),
      removeItem: vi.fn(),
      setItem: vi.fn(),
    } as unknown as Storage;
  }

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  function configureWithoutWindow(): void {
    vi.stubGlobal('window', undefined);
    configureDocument({ defaultView: null } as unknown as Document);
  }

  describe('WINDOW', () => {
    it('should return DOCUMENT.defaultView when available', () => {
      const fakeWindow = {} as Window;
      const fakeDocument = { defaultView: fakeWindow } as unknown as Document;

      configureDocument(fakeDocument);

      expect(TestBed.inject(WINDOW)).toBe(fakeWindow);
    });

    it('should fall back to the global window when DOCUMENT.defaultView is missing', () => {
      const fakeWindow = {} as Window;
      const fakeDocument = { defaultView: undefined } as unknown as Document;

      vi.stubGlobal('window', fakeWindow);
      configureDocument(fakeDocument);

      expect(TestBed.inject(WINDOW)).toBe(fakeWindow);
    });

    it('should return undefined when DOCUMENT.defaultView and global window are unavailable', () => {
      const fakeDocument = { defaultView: undefined } as unknown as Document;

      vi.stubGlobal('window', undefined);
      configureDocument(fakeDocument);

      expect(TestBed.inject(WINDOW)).toBeUndefined();
    });
  });

  describe('LOCATION', () => {
    it('should return DOCUMENT.location', () => {
      const fakeLocation = { href: 'https://atlasng.dev' } as Location;
      const fakeDocument = { location: fakeLocation } as unknown as Document;

      configureDocument(fakeDocument);

      expect(TestBed.inject(LOCATION)).toBe(fakeLocation);
    });
  });

  describe('CUSTOM_ELEMENT_REGISTRY', () => {
    it('should return undefined when no window is available', () => {
      configureWithoutWindow();

      expect(TestBed.inject(CUSTOM_ELEMENT_REGISTRY)).toBeUndefined();
    });

    it('should return window.customElements when available', () => {
      const fakeRegistry = {} as CustomElementRegistry;
      const fakeWindow = { customElements: fakeRegistry } as unknown as Window;

      TestBed.configureTestingModule({
        providers: [{ provide: WINDOW, useValue: fakeWindow }],
      });

      expect(TestBed.inject(CUSTOM_ELEMENT_REGISTRY)).toBe(fakeRegistry);
    });

    it('should return undefined when window.customElements is missing', () => {
      const fakeWindow = {} as Window;

      TestBed.configureTestingModule({
        providers: [{ provide: WINDOW, useValue: fakeWindow }],
      });

      expect(TestBed.inject(CUSTOM_ELEMENT_REGISTRY)).toBeUndefined();
    });
  });

  describe('NAVIGATION', () => {
    it('should return undefined when no window is available', () => {
      configureWithoutWindow();

      expect(TestBed.inject(NAVIGATION)).toBeUndefined();
    });

    it('should return window.navigation when available', () => {
      const fakeNavigation = new EventTarget() as Navigation;
      const fakeWindow = { navigation: fakeNavigation } as unknown as Window;

      TestBed.configureTestingModule({
        providers: [{ provide: WINDOW, useValue: fakeWindow }],
      });

      expect(TestBed.inject(NAVIGATION)).toBe(fakeNavigation);
    });

    it('should return undefined when the Navigation API is missing', () => {
      const fakeWindow = {} as Window;

      TestBed.configureTestingModule({
        providers: [{ provide: WINDOW, useValue: fakeWindow }],
      });

      expect(TestBed.inject(NAVIGATION)).toBeUndefined();
    });
  });

  describe('RESIZE_OBSERVER', () => {
    it('should return undefined when no window is available', () => {
      configureWithoutWindow();

      expect(TestBed.inject(RESIZE_OBSERVER)).toBeUndefined();
    });

    it('should return the ResizeObserver constructor when available', () => {
      const fakeResizeObserver = class {} as unknown as typeof ResizeObserver;
      const fakeWindow = { ResizeObserver: fakeResizeObserver } as unknown as Window;

      TestBed.configureTestingModule({
        providers: [{ provide: WINDOW, useValue: fakeWindow }],
      });

      expect(TestBed.inject(RESIZE_OBSERVER)).toBe(fakeResizeObserver);
    });

    it('should return undefined when the ResizeObserver is missing', () => {
      const fakeWindow = {} as Window;

      TestBed.configureTestingModule({
        providers: [{ provide: WINDOW, useValue: fakeWindow }],
      });

      expect(TestBed.inject(RESIZE_OBSERVER)).toBeUndefined();
    });
  });

  describe('LOCAL_STORAGE', () => {
    it('should return undefined when no window is available', () => {
      configureWithoutWindow();

      expect(TestBed.inject(LOCAL_STORAGE)).toBeUndefined();
    });

    it('should return window.localStorage when available', () => {
      const fakeStorage = createStorage();
      const fakeWindow = { localStorage: fakeStorage } as Window;

      TestBed.configureTestingModule({
        providers: [{ provide: WINDOW, useValue: fakeWindow }],
      });

      expect(TestBed.inject(LOCAL_STORAGE)).toBe(fakeStorage);
    });

    it('should return undefined when window.localStorage is unavailable', () => {
      const fakeWindow = {
        get localStorage() {
          throw new Error('storage unavailable');
        },
      } as unknown as Window;

      TestBed.configureTestingModule({
        providers: [{ provide: WINDOW, useValue: fakeWindow }],
      });

      expect(TestBed.inject(LOCAL_STORAGE)).toBeUndefined();
    });
  });

  describe('SESSION_STORAGE', () => {
    it('should return undefined when no window is available', () => {
      configureWithoutWindow();

      expect(TestBed.inject(SESSION_STORAGE)).toBeUndefined();
    });

    it('should return window.sessionStorage when available', () => {
      const fakeStorage = createStorage();
      const fakeWindow = { sessionStorage: fakeStorage } as Window;

      TestBed.configureTestingModule({
        providers: [{ provide: WINDOW, useValue: fakeWindow }],
      });

      expect(TestBed.inject(SESSION_STORAGE)).toBe(fakeStorage);
    });

    it('should return undefined when window.sessionStorage is unavailable', () => {
      const fakeWindow = {
        get sessionStorage() {
          throw new Error('storage unavailable');
        },
      } as unknown as Window;

      TestBed.configureTestingModule({
        providers: [{ provide: WINDOW, useValue: fakeWindow }],
      });

      expect(TestBed.inject(SESSION_STORAGE)).toBeUndefined();
    });
  });

  describe.each([
    ['SAFE_LOCAL_STORAGE', SAFE_LOCAL_STORAGE, LOCAL_STORAGE],
    ['SAFE_SESSION_STORAGE', SAFE_SESSION_STORAGE, SESSION_STORAGE],
  ] as const)('%s', (_name, token, storageToken) => {
    it('should wrap the storage when available', () => {
      const fakeStorage = createStorage();
      vi.mocked(fakeStorage.getItem).mockReturnValue('value');

      TestBed.configureTestingModule({
        providers: [{ provide: storageToken, useValue: fakeStorage }],
      });

      const storage = TestBed.inject(token);
      expect(storage.available).toBe(true);
      expect(storage.getItem('key')).toBe('value');
      expect(fakeStorage.getItem).toHaveBeenCalledWith('key');
    });

    it('should resolve to an unavailable adapter when no window is available', () => {
      configureWithoutWindow();

      const storage = TestBed.inject(token);
      expect(storage.available).toBe(false);
      expect(storage.setItem('key', 'value')).toBe(false);
    });
  });
});
