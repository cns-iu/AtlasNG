import { TestBed } from '@angular/core/testing';
import {
  CUSTOM_ELEMENT_REGISTRY,
  DOCUMENT,
  LOCAL_STORAGE,
  LOCATION,
  RESIZE_OBSERVER,
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

    it('should throw when DOCUMENT.defaultView and global window are unavailable', () => {
      const fakeDocument = { defaultView: undefined } as unknown as Document;

      vi.stubGlobal('window', undefined);
      configureDocument(fakeDocument);

      expect(() => TestBed.inject(WINDOW)).toThrowErrorMatchingInlineSnapshot(
        `[Error: No global "window" object available.]`,
      );
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

  describe('RESIZE_OBSERVER', () => {
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
});
