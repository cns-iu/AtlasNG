import { TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENT_REGISTRY, DOCUMENT, LOCATION, RESIZE_OBSERVER, WINDOW } from './browser-tokens';

describe('browser tokens', () => {
  function configureDocument(document: Document): void {
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: document }],
    });
  }

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  it('WINDOW should return DOCUMENT.defaultView when available', () => {
    const fakeWindow = {} as Window;
    const fakeDocument = { defaultView: fakeWindow } as unknown as Document;

    configureDocument(fakeDocument);

    expect(TestBed.inject(WINDOW)).toBe(fakeWindow);
  });

  it('WINDOW should fall back to the global window when DOCUMENT.defaultView is missing', () => {
    const fakeWindow = {} as Window;
    const fakeDocument = { defaultView: undefined } as unknown as Document;

    vi.stubGlobal('window', fakeWindow);
    configureDocument(fakeDocument);

    expect(TestBed.inject(WINDOW)).toBe(fakeWindow);
  });

  it('WINDOW should throw when DOCUMENT.defaultView and global window are unavailable', () => {
    const fakeDocument = { defaultView: undefined } as unknown as Document;

    vi.stubGlobal('window', undefined);
    configureDocument(fakeDocument);

    expect(() => TestBed.inject(WINDOW)).toThrowErrorMatchingInlineSnapshot(
      `[Error: No global "window" object available.]`,
    );
  });

  it('LOCATION should return DOCUMENT.location', () => {
    const fakeLocation = { href: 'https://atlasng.dev' } as Location;
    const fakeDocument = { location: fakeLocation } as unknown as Document;

    configureDocument(fakeDocument);

    expect(TestBed.inject(LOCATION)).toBe(fakeLocation);
  });

  it('CUSTOM_ELEMENT_REGISTRY should return window.customElements when available', () => {
    const fakeRegistry = {} as CustomElementRegistry;
    const fakeWindow = { customElements: fakeRegistry } as unknown as Window;

    TestBed.configureTestingModule({
      providers: [{ provide: WINDOW, useValue: fakeWindow }],
    });

    expect(TestBed.inject(CUSTOM_ELEMENT_REGISTRY)).toBe(fakeRegistry);
  });

  it('CUSTOM_ELEMENT_REGISTRY should return undefined when window.customElements is missing', () => {
    const fakeWindow = {} as Window;

    TestBed.configureTestingModule({
      providers: [{ provide: WINDOW, useValue: fakeWindow }],
    });

    expect(TestBed.inject(CUSTOM_ELEMENT_REGISTRY)).toBeUndefined();
  });

  it('RESIZE_OBSERVER should return the ResizeObserver constructor when available', () => {
    const fakeResizeObserver = class {} as unknown as typeof ResizeObserver;
    const fakeWindow = { ResizeObserver: fakeResizeObserver } as unknown as Window;

    TestBed.configureTestingModule({
      providers: [{ provide: WINDOW, useValue: fakeWindow }],
    });

    expect(TestBed.inject(RESIZE_OBSERVER)).toBe(fakeResizeObserver);
  });

  it('RESIZE_OBSERVER should return undefined when the ResizeObserver is missing', () => {
    const fakeWindow = {} as Window;

    TestBed.configureTestingModule({
      providers: [{ provide: WINDOW, useValue: fakeWindow }],
    });

    expect(TestBed.inject(RESIZE_OBSERVER)).toBeUndefined();
  });
});
