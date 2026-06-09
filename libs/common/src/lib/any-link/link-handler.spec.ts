import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { DefaultUrlSerializer, type NavigationBehaviorOptions, UrlSerializer } from '@angular/router';
import { CUSTOM_ELEMENT_REGISTRY, LOCATION } from '@atlasng/core';
import {
  type LinkAttributes,
  LinkHandler,
  PreparedLink,
  RouterlessLinkHandler,
  RouterlessLinkHandlerContext,
} from './link-handler';

describe('RouterlessLinkHandler', () => {
  const BASE_URL = 'https://example.com/privacy';

  let handler: RouterlessLinkHandler;
  let browserLocation: { assign: ReturnType<typeof vi.fn>; replace: ReturnType<typeof vi.fn> };
  let angularLocation: {
    path: ReturnType<typeof vi.fn>;
    prepareExternalUrl: ReturnType<typeof vi.fn<(url: string) => string>>;
  };
  let customElementRegistry: { get: ReturnType<typeof vi.fn> };

  function configureTestingModule(currentPath = '/current/child?existing=1#old'): void {
    browserLocation = {
      assign: vi.fn(),
      replace: vi.fn(),
    };

    angularLocation = {
      path: vi.fn().mockReturnValue(currentPath),
      prepareExternalUrl: vi.fn((url: string) => `/base${url}`),
    };

    customElementRegistry = {
      get: vi.fn().mockReturnValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        RouterlessLinkHandler,
        { provide: LOCATION, useValue: browserLocation },
        { provide: CUSTOM_ELEMENT_REGISTRY, useValue: customElementRegistry },
        { provide: Location, useValue: angularLocation },
        { provide: UrlSerializer, useValue: new DefaultUrlSerializer() },
      ],
    });

    handler = TestBed.inject(RouterlessLinkHandler);
  }

  function defaultOptions(overrides?: Partial<NavigationBehaviorOptions>): NavigationBehaviorOptions {
    return {
      skipLocationChange: false,
      replaceUrl: false,
      state: undefined,
      info: undefined,
      browserUrl: undefined,
      ...overrides,
    };
  }

  function enableProdMode() {
    const global = globalThis as Record<string, unknown>;
    const originalNgDevMode = global['ngDevMode'];
    global['ngDevMode'] = false;
    return () => {
      global['ngDevMode'] = originalNgDevMode;
    };
  }

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('LinkHandler token should resolve to RouterlessLinkHandler', () => {
    configureTestingModule();

    const resolved = TestBed.inject(LinkHandler);

    expect(resolved).toBeInstanceOf(RouterlessLinkHandler);
    expect(resolved).toBe(handler);
  });

  describe('prepareLink', () => {
    it('should serialize route commands into external URLs', () => {
      configureTestingModule();

      const attributes: LinkAttributes = { rel: 'noopener', target: '_blank' };
      const link = handler.prepareLink({ command: '/next' }, undefined, attributes);

      expect(link.href).toBe('/base/next');
      expect(link.attributes).toEqual(attributes);
      expect(link.handlerContext.isAnchorLikeElement).toBe(false);
    });

    it('should preserve absolute URL commands', () => {
      configureTestingModule();

      const link = handler.prepareLink({ command: `${BASE_URL}` });

      expect(link.href).toBe(BASE_URL);
    });

    it('should apply query params and fragment options to absolute URL commands', () => {
      configureTestingModule();

      const link = handler.prepareLink({
        command: `${BASE_URL}?existing=1#old`,
        queryParamsHandling: 'merge',
        queryParams: {
          existing: '2',
          add: ['a', 'b'],
        },
        fragment: 'new',
      });

      expect(link.href).toBe(`${BASE_URL}?existing=2&add=a&add=b#new`);
    });

    it('should resolve relative commands and preserve query params and fragment when configured', () => {
      configureTestingModule();

      const link = handler.prepareLink({
        command: ['..', 'sibling'],
        queryParams: { ignored: 'x' },
        queryParamsHandling: 'preserve',
        preserveFragment: true,
        fragment: 'new',
      });

      expect(link.href).toBe('/base/current/sibling?existing=1#old');
    });

    it('should merge query params from current URL when queryParamsHandling is merge', () => {
      configureTestingModule('/current/path?existing=1&keep=2#old');

      const link = handler.prepareLink({
        command: '/target',
        queryParamsHandling: 'merge',
        queryParams: {
          existing: '9',
          add: '3',
        },
      });

      const parsed = new URL(link.href, 'https://atlasng.dev');

      expect(parsed.pathname).toBe('/base/target');
      expect(parsed.searchParams.get('existing')).toBe('9');
      expect(parsed.searchParams.get('keep')).toBe('2');
      expect(parsed.searchParams.get('add')).toBe('3');
    });

    it('should skip outlets in command arrays and warn in dev mode', () => {
      configureTestingModule('/current/path');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      const link = handler.prepareLink({
        command: ['/one', { outlets: { aux: 'two' } }, 'three'],
      });

      expect(link.href).toBe('/base/one/three');
      expect(warnSpy).toHaveBeenCalledWith(
        'Outlets in command arrays are not supported by RouterlessLinkHandler and will be skipped.',
      );
    });

    it('should support UrlTree commands without recalculating path', () => {
      configureTestingModule();

      const serializer = TestBed.inject(UrlSerializer);
      const urlTree = serializer.parse('/prebuilt?x=1#hash');
      const link = handler.prepareLink({ command: urlTree });

      expect(link.href).toBe('/base/prebuilt?x=1#hash');
    });

    it('should normalize empty and dot path tokens and resolve parent traversal', () => {
      configureTestingModule('/a/b/c');

      const link = handler.prepareLink({
        command: ['', '.', '..', null, undefined, { segmentPath: 'next/final' }],
      });

      expect(link.href).toBe('/base/a/b/next/final');
    });

    it('should return root when parent traversal clears all segments', () => {
      configureTestingModule('/a');

      const link = handler.prepareLink({
        command: ['..'],
      });

      expect(link.href).toBe('/base/');
    });

    it('should warn when relativeTo is provided', () => {
      configureTestingModule();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      handler.prepareLink({ command: '/next', relativeTo: {} as never });

      expect(warnSpy).toHaveBeenCalledWith('The "relativeTo" option is not supported by RouterlessLinkHandler.');
    });

    it('should not warn about unsupported options in production mode', () => {
      configureTestingModule();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const restoreProdMode = enableProdMode();

      handler.prepareLink({ command: ['/next', {}], relativeTo: {} as never });

      expect(warnSpy).not.toHaveBeenCalled();

      restoreProdMode();
    });
  });

  describe('navigateTo', () => {
    function prepareLink(tagName = 'DIV'): PreparedLink<RouterlessLinkHandlerContext> {
      return handler.prepareLink({ command: '/next' }, { tagName } as Element);
    }

    it('should allow native navigation for anchor-like elements', () => {
      configureTestingModule();

      const link = prepareLink('A');
      const shouldContinueNativeNavigation = handler.navigateTo(link, new Event('click'), defaultOptions());

      expect(shouldContinueNativeNavigation).toBe(true);
      expect(browserLocation.assign).not.toHaveBeenCalled();
      expect(browserLocation.replace).not.toHaveBeenCalled();
    });

    it('should allow native navigation for anchor-like custom elements', () => {
      configureTestingModule();
      customElementRegistry.get.mockReturnValue({ observedAttributes: ['href'] });

      const link = prepareLink('x-link');
      const shouldContinueNativeNavigation = handler.navigateTo(link, new Event('click'), defaultOptions());

      expect(shouldContinueNativeNavigation).toBe(true);
      expect(customElementRegistry.get).toHaveBeenCalledWith('x-link');
      expect(browserLocation.assign).not.toHaveBeenCalled();
      expect(browserLocation.replace).not.toHaveBeenCalled();
    });

    it('should assign browser location when replaceUrl is false', () => {
      configureTestingModule();

      const link = prepareLink();
      const shouldContinueNativeNavigation = handler.navigateTo(
        link,
        new Event('click'),
        defaultOptions({ replaceUrl: false }),
      );

      expect(shouldContinueNativeNavigation).toBe(false);
      expect(browserLocation.assign).toHaveBeenCalledWith('/base/next');
      expect(browserLocation.replace).not.toHaveBeenCalled();
    });

    it('should replace browser location when replaceUrl is true', () => {
      configureTestingModule();

      const link = prepareLink();
      const shouldContinueNativeNavigation = handler.navigateTo(
        link,
        new Event('click'),
        defaultOptions({ replaceUrl: true }),
      );

      expect(shouldContinueNativeNavigation).toBe(false);
      expect(browserLocation.replace).toHaveBeenCalledWith('/base/next');
      expect(browserLocation.assign).not.toHaveBeenCalled();
    });

    it('should warn when unsupported navigation options are provided', () => {
      configureTestingModule();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      const link = prepareLink();
      handler.navigateTo(
        link,
        new Event('click'),
        defaultOptions({
          skipLocationChange: true,
          state: { from: 'test' },
          browserUrl: '/shadow',
        }),
      );

      expect(warnSpy).toHaveBeenCalledWith(
        'The "skipLocationChange" option is not supported by RouterlessLinkHandler.',
      );
      expect(warnSpy).toHaveBeenCalledWith('The "state" option is not supported by RouterlessLinkHandler.');
      expect(warnSpy).toHaveBeenCalledWith('The "browserUrl" option is not supported by RouterlessLinkHandler.');
    });

    it('should not warn about unsupported options in production mode', () => {
      configureTestingModule();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const restoreProdMode = enableProdMode();

      const link = prepareLink();
      handler.navigateTo(
        link,
        new Event('click'),
        defaultOptions({
          skipLocationChange: true,
          state: { from: 'test' },
          browserUrl: '/shadow',
        }),
      );

      expect(warnSpy).not.toHaveBeenCalled();

      restoreProdMode();
    });
  });
});
