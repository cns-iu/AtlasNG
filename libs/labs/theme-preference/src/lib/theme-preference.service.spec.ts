import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LOCAL_STORAGE, WINDOW } from '@atlasng/core';
import { provideThemePreference, ThemePreferenceService } from './theme-preference.service';

describe('ThemePreferenceService', () => {
  const storageKey = 'test-theme-preference';
  let mediaQueryListener: ((event: MediaQueryListEvent) => void) | undefined;
  let mediaQuery: MediaQueryList;
  let storage: Storage;

  function setup({ dark = false, stored }: { dark?: boolean; stored?: string } = {}): ThemePreferenceService {
    storage = {
      length: 0,
      clear: vi.fn(),
      getItem: vi.fn(() => stored ?? null),
      key: vi.fn(),
      removeItem: vi.fn(),
      setItem: vi.fn(),
    } as unknown as Storage;

    mediaQuery = {
      matches: dark,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener: vi.fn((_type: string, listener: EventListenerOrEventListenerObject) => {
        mediaQueryListener = listener as (event: MediaQueryListEvent) => void;
      }),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };

    const window = { matchMedia: vi.fn(() => mediaQuery) } as unknown as Window;
    TestBed.configureTestingModule({
      providers: [
        { provide: WINDOW, useValue: window },
        { provide: LOCAL_STORAGE, useValue: storage },
        provideThemePreference({
          storageKey,
          lightThemeClass: 'test-light-theme',
          darkThemeClass: 'test-dark-theme',
        }),
      ],
    });

    return TestBed.inject(ThemePreferenceService);
  }

  afterEach(() => {
    const root = TestBed.inject(DOCUMENT).documentElement;
    root.removeAttribute('data-theme');
    root.style.removeProperty('color-scheme');
    root.classList.remove('test-light-theme', 'test-dark-theme');
    TestBed.resetTestingModule();
    mediaQueryListener = undefined;
  });

  it('uses the device setting by default', () => {
    const service = setup({ dark: true });

    expect(service.preference()).toBe('system');
    expect(service.resolvedTheme()).toBe('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(document.documentElement).toHaveClass('test-dark-theme');
    expect(document.documentElement).toHaveStyle({ colorScheme: 'dark' });
  });

  it('restores a valid persisted preference', () => {
    const service = setup({ dark: false, stored: 'dark' });

    expect(service.preference()).toBe('dark');
    expect(service.resolvedTheme()).toBe('dark');
  });

  it('ignores an invalid persisted preference', () => {
    const service = setup({ dark: false, stored: 'sepia' });

    expect(service.preference()).toBe('system');
    expect(service.resolvedTheme()).toBe('light');
  });

  it('persists and applies an explicit preference', () => {
    const service = setup({ dark: false });

    service.setPreference('dark');

    expect(storage.setItem).toHaveBeenCalledWith(storageKey, 'dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(document.documentElement).toHaveClass('test-dark-theme');
    expect(document.documentElement).not.toHaveClass('test-light-theme');
  });

  it('tracks device changes while the system preference is active', () => {
    const service = setup({ dark: false });

    mediaQueryListener?.({ matches: true } as MediaQueryListEvent);

    expect(service.resolvedTheme()).toBe('dark');
    expect(document.documentElement).toHaveClass('test-dark-theme');
  });

  it('does not replace an explicit preference when the device setting changes', () => {
    const service = setup({ dark: false });
    service.setPreference('light');

    mediaQueryListener?.({ matches: true } as MediaQueryListEvent);

    expect(service.preference()).toBe('light');
    expect(service.resolvedTheme()).toBe('light');
    expect(document.documentElement).toHaveClass('test-light-theme');
  });

  it('resets to the device preference and removes the persisted override', () => {
    const service = setup({ dark: true, stored: 'light' });

    service.resetPreference();

    expect(service.preference()).toBe('system');
    expect(service.resolvedTheme()).toBe('dark');
    expect(storage.removeItem).toHaveBeenCalledWith(storageKey);
    expect(document.documentElement).toHaveClass('test-dark-theme');
  });

  it('removes the media-query listener when destroyed', () => {
    setup();

    TestBed.resetTestingModule();

    expect(mediaQuery.removeEventListener).toHaveBeenCalledWith('change', mediaQueryListener);
  });
});
