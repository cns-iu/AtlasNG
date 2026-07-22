import {
  DestroyRef,
  inject,
  Injectable,
  InjectionToken,
  Provider,
  RendererFactory2,
  signal,
  computed,
} from '@angular/core';
import { DOCUMENT, LOCAL_STORAGE, WINDOW } from '@atlasng/core';
import { isThemePreference, ResolvedTheme, ThemePreference } from './theme-preference';

/** Default media query used to resolve the device color scheme. */
const DARK_MODE_MEDIA_QUERY = '(prefers-color-scheme: dark)';

/** Default browser-storage key for the selected theme preference. */
const DEFAULT_STORAGE_KEY = '__atlasng_theme_preference__';

/**
 * Configuration for {@link ThemePreferenceService}.
 */
export interface ThemePreferenceConfig {
  /** Storage backend used for persistence, or `false` to disable persistence. */
  storage?: Storage | false;

  /** Storage key used to persist the selected preference. */
  storageKey?: string;

  /** Optional CSS class applied when the resolved theme is light. */
  lightThemeClass?: string;

  /** Optional CSS class applied when the resolved theme is dark. */
  darkThemeClass?: string;

  /** Document-root attribute that receives the resolved theme, or `false` to disable it. */
  themeAttribute?: string | false;
}

/** Internal configuration token for the theme-preference service. */
const THEME_PREFERENCE_CONFIG = new InjectionToken<ThemePreferenceConfig>('THEME_PREFERENCE_CONFIG', {
  providedIn: 'root',
  factory: () => ({}),
});

/** Fully resolved configuration used internally by the service. */
interface ResolvedThemePreferenceConfig {
  readonly storage: Storage | false;
  readonly storageKey: string;
  readonly lightThemeClass?: string;
  readonly darkThemeClass?: string;
  readonly themeAttribute: string | false;
}

/**
 * Provides application-specific theme class and persistence configuration.
 *
 * @param config Theme-preference configuration.
 * @returns Provider for the theme-preference configuration token.
 */
export function provideThemePreference(config: ThemePreferenceConfig): Provider {
  return { provide: THEME_PREFERENCE_CONFIG, useValue: config };
}

/**
 * Resolves injected configuration with browser-aware defaults.
 *
 * @returns Fully resolved theme-preference configuration.
 */
function injectThemePreferenceConfig(): ResolvedThemePreferenceConfig {
  const config = inject(THEME_PREFERENCE_CONFIG);
  return {
    storage: config.storage ?? inject(LOCAL_STORAGE) ?? false,
    storageKey: config.storageKey ?? DEFAULT_STORAGE_KEY,
    lightThemeClass: config.lightThemeClass,
    darkThemeClass: config.darkThemeClass,
    themeAttribute: config.themeAttribute ?? 'data-theme',
  };
}

/**
 * Persists a user's theme preference, resolves device settings, and applies the active theme.
 */
@Injectable({ providedIn: 'root' })
export class ThemePreferenceService {
  /** Window abstraction used for device-theme detection. */
  readonly #window = inject(WINDOW);

  /** Document abstraction whose root element receives the active theme. */
  readonly #document = inject(DOCUMENT);

  /** Renderer used for document-root attributes, classes, and styles. */
  readonly #renderer = inject(RendererFactory2).createRenderer(null, null);

  /** Resolved service configuration. */
  readonly #config = injectThemePreferenceConfig();

  /** Writable user preference state. */
  readonly #preference = signal<ThemePreference>('system');

  /** Writable device-theme state. */
  readonly #deviceTheme = signal<ResolvedTheme>('light');

  /** Media-query object used to observe device-theme changes when supported. */
  readonly #darkModeQuery =
    typeof this.#window.matchMedia === 'function' ? this.#window.matchMedia(DARK_MODE_MEDIA_QUERY) : undefined;

  /** The preference explicitly selected by the user. */
  readonly preference = this.#preference.asReadonly();

  /** The concrete light or dark theme currently applied to the application. */
  readonly resolvedTheme = computed<ResolvedTheme>(() => {
    const preference = this.#preference();
    return preference === 'system' ? this.#deviceTheme() : preference;
  });

  /** Initializes persisted state, device detection, and document theming. */
  constructor() {
    this.#deviceTheme.set(this.#darkModeQuery?.matches ? 'dark' : 'light');
    this.#loadPreference();
    this.#listenForDeviceThemeChanges();
    this.#applyResolvedTheme();
  }

  /**
   * Saves and applies a theme preference.
   *
   * @param preference Preference selected by the user.
   */
  setPreference(preference: ThemePreference): void {
    this.#preference.set(preference);
    this.#savePreference(preference);
    this.#applyResolvedTheme();
  }

  /** Restores device-controlled theming and removes the persisted override. */
  resetPreference(): void {
    this.#preference.set('system');
    this.#removeStoredPreference();
    this.#applyResolvedTheme();
  }

  /** Loads a valid persisted preference when storage is available. */
  #loadPreference(): void {
    const { storage, storageKey } = this.#config;
    if (!storage) {
      return;
    }

    try {
      const storedPreference = storage.getItem(storageKey);
      if (isThemePreference(storedPreference)) {
        this.#preference.set(storedPreference);
      }
    } catch {
      // Storage can become unavailable after feature detection; retain the device default.
    }
  }

  /**
   * Persists the current preference when storage is available.
   *
   * @param preference Preference to persist.
   */
  #savePreference(preference: ThemePreference): void {
    const { storage, storageKey } = this.#config;
    if (!storage) {
      return;
    }

    try {
      storage.setItem(storageKey, preference);
    } catch {
      // Ignore storage failures such as private-mode restrictions or exhausted quota.
    }
  }

  /** Removes a persisted preference when storage is available. */
  #removeStoredPreference(): void {
    const { storage, storageKey } = this.#config;
    if (!storage) {
      return;
    }

    try {
      storage.removeItem(storageKey);
    } catch {
      // Ignore storage failures and continue using the in-memory device preference.
    }
  }

  /** Registers and tears down device-theme change handling. */
  #listenForDeviceThemeChanges(): void {
    const query = this.#darkModeQuery;
    if (!query) {
      return;
    }

    const handler = (event: MediaQueryListEvent): void => {
      this.#deviceTheme.set(event.matches ? 'dark' : 'light');
      if (this.#preference() === 'system') {
        this.#applyResolvedTheme();
      }
    };

    query.addEventListener('change', handler);
    inject(DestroyRef).onDestroy(() => query.removeEventListener('change', handler));
  }

  /** Applies the resolved theme to the document root. */
  #applyResolvedTheme(): void {
    const root = this.#document.documentElement;
    const theme = this.resolvedTheme();
    const { darkThemeClass, lightThemeClass, themeAttribute } = this.#config;

    if (themeAttribute) {
      this.#renderer.setAttribute(root, themeAttribute, theme);
    }

    this.#renderer.setStyle(root, 'color-scheme', theme);

    if (lightThemeClass) {
      this.#renderer.removeClass(root, lightThemeClass);
    }
    if (darkThemeClass) {
      this.#renderer.removeClass(root, darkThemeClass);
    }

    const activeThemeClass = theme === 'light' ? lightThemeClass : darkThemeClass;
    if (activeThemeClass) {
      this.#renderer.addClass(root, activeThemeClass);
    }
  }
}
