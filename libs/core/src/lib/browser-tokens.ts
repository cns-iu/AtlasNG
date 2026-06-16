import { DOCUMENT, inject, InjectionToken } from '@angular/core';
import { isStorageAvailable } from './utils';

/**
 * Re-export of Angular's platform-agnostic document token.
 */
export { DOCUMENT };

/**
 * Injection token for the global {@link Window} object.
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
 * Injection token for the current {@link Location} object.
 */
export const LOCATION = new InjectionToken<Location>('LOCATION', {
  providedIn: 'root',
  factory: () => inject(DOCUMENT).location,
});

/**
 * Injection token for the browser {@link CustomElementRegistry}, when available.
 */
export const CUSTOM_ELEMENT_REGISTRY = new InjectionToken<CustomElementRegistry | undefined>(
  'CUSTOM_ELEMENT_REGISTRY',
  {
    providedIn: 'root',
    factory: () => {
      const window = inject(WINDOW);
      if (typeof window.customElements === 'object') {
        return window.customElements;
      }

      return undefined;
    },
  },
);

/**
 * Injection token for the browser {@link ResizeObserver} API, when available.
 */
export const RESIZE_OBSERVER = new InjectionToken<typeof ResizeObserver | undefined>('RESIZE_OBSERVER', {
  providedIn: 'root',
  factory: () => {
    const window = inject(WINDOW);
    if (typeof window.ResizeObserver === 'function') {
      return window.ResizeObserver;
    }

    return undefined;
  },
});

/**
 * Injection token for the browser {@link localStorage} API, when available.
 */
export const LOCAL_STORAGE = new InjectionToken<Storage | undefined>('LOCAL_STORAGE', {
  providedIn: 'root',
  factory: () => {
    const window = inject(WINDOW);
    const getStorage = () => window.localStorage;
    return isStorageAvailable(getStorage) ? getStorage() : undefined;
  },
});

/**
 * Injection token for the browser {@link sessionStorage} API, when available.
 */
export const SESSION_STORAGE = new InjectionToken<Storage | undefined>('SESSION_STORAGE', {
  providedIn: 'root',
  factory: () => {
    const window = inject(WINDOW);
    const getStorage = () => window.sessionStorage;
    return isStorageAvailable(getStorage) ? getStorage() : undefined;
  },
});
