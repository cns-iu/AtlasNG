import { DOCUMENT, inject, InjectionToken } from '@angular/core';
import { isStorageAvailable } from './utils/storage';

/**
 * Re-export of Angular's platform-agnostic document token.
 */
export { DOCUMENT };

/**
 * Injection token for the global {@link Window} object.
 *
 * Resolves to `DOCUMENT.defaultView`, falling back to the global `window`.
 *
 * @throws {Error} When neither `DOCUMENT.defaultView` nor a global `window` is available,
 * for example during server-side rendering. Use the optional tokens such as
 * {@link LOCAL_STORAGE} when a missing window should be tolerated.
 */
export const WINDOW = new InjectionToken<Window & typeof globalThis>('WINDOW', {
  providedIn: 'root',
  factory: () => {
    const document = inject(DOCUMENT);
    if (document.defaultView) {
      return document.defaultView;
    } else if (typeof window !== 'undefined') {
      return window;
    }

    throw new Error('No global "window" object available.');
  },
});

/**
 * Injects {@link WINDOW}, returning `undefined` instead of throwing when no window is available.
 *
 * Must be called in an injection context.
 *
 * @returns The injected window, or `undefined` when none is available.
 */
function injectOptionalWindow(): (Window & typeof globalThis) | undefined {
  try {
    return inject(WINDOW);
  } catch {
    return undefined;
  }
}

/**
 * Injection token for the current {@link Location} object.
 */
export const LOCATION = new InjectionToken<Location>('LOCATION', {
  providedIn: 'root',
  factory: () => inject(DOCUMENT).location,
});

/**
 * Injection token for the browser {@link CustomElementRegistry}, when available.
 *
 * Resolves to `undefined` when no window is available, for example during server-side rendering.
 */
export const CUSTOM_ELEMENT_REGISTRY = new InjectionToken<CustomElementRegistry | undefined>(
  'CUSTOM_ELEMENT_REGISTRY',
  {
    providedIn: 'root',
    factory: () => {
      const window = injectOptionalWindow();
      if (typeof window?.customElements === 'object') {
        return window.customElements;
      }

      return undefined;
    },
  },
);

/**
 * Injection token for the browser {@link ResizeObserver} API, when available.
 *
 * Resolves to `undefined` when no window is available, for example during server-side rendering.
 */
export const RESIZE_OBSERVER = new InjectionToken<typeof ResizeObserver | undefined>('RESIZE_OBSERVER', {
  providedIn: 'root',
  factory: () => {
    const window = injectOptionalWindow();
    if (typeof window?.ResizeObserver === 'function') {
      return window.ResizeObserver;
    }

    return undefined;
  },
});

/**
 * Injection token for the browser {@link localStorage} API, when available.
 *
 * Resolves to `undefined` when no window is available, for example during server-side rendering.
 */
export const LOCAL_STORAGE = new InjectionToken<Storage | undefined>('LOCAL_STORAGE', {
  providedIn: 'root',
  factory: () => {
    const window = injectOptionalWindow();
    if (!window) {
      return undefined;
    }

    const getStorage = () => window.localStorage;
    return isStorageAvailable(getStorage) ? getStorage() : undefined;
  },
});

/**
 * Injection token for the browser {@link sessionStorage} API, when available.
 *
 * Resolves to `undefined` when no window is available, for example during server-side rendering.
 */
export const SESSION_STORAGE = new InjectionToken<Storage | undefined>('SESSION_STORAGE', {
  providedIn: 'root',
  factory: () => {
    const window = injectOptionalWindow();
    if (!window) {
      return undefined;
    }

    const getStorage = () => window.sessionStorage;
    return isStorageAvailable(getStorage) ? getStorage() : undefined;
  },
});
