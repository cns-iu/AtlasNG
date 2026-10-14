import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import {
  DefaultUrlSerializer,
  type IsActiveMatchOptions,
  type NavigationBehaviorOptions,
  UrlSerializer,
} from '@angular/router';
import { CUSTOM_ELEMENT_REGISTRY, LOCATION, NAVIGATION, WINDOW } from '@atlasng/core';
import { LinkHandler, type LinkAttributes } from './handler';
import { RouterlessLinkHandler, type RouterlessPreparedLink } from './routerless-handler';

describe('RouterlessLinkHandler', () => {
  interface BrowserLocation {
    assign: ReturnType<typeof vi.fn<(url: string | URL) => void>>;
    href: string;
    replace: ReturnType<typeof vi.fn<(url: string | URL) => void>>;
  }

  interface AngularLocation {
    path: ReturnType<typeof vi.fn<(includeHash?: boolean) => string>>;
    prepareExternalUrl: ReturnType<typeof vi.fn<(url: string) => string>>;
  }

  interface TestContext {
    angularLocation: AngularLocation;
    browserLocation: BrowserLocation;
    customElementRegistry: { get: ReturnType<typeof vi.fn> };
    handler: RouterlessLinkHandler;
  }

  function setup(currentPath = '/current/child?existing=1#old'): TestContext {
    const angularLocation = {
      path: vi.fn().mockReturnValue(currentPath),
      prepareExternalUrl: vi.fn((url: string) => `/base${url}`),
    };
    const browserLocation = {
      assign: vi.fn(),
      href: currentPath,
      replace: vi.fn(),
    };
    const customElementRegistry = {
      get: vi.fn().mockReturnValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        RouterlessLinkHandler,
        { provide: CUSTOM_ELEMENT_REGISTRY, useValue: customElementRegistry },
        { provide: LOCATION, useValue: browserLocation },
        { provide: Location, useValue: angularLocation },
        { provide: UrlSerializer, useValue: new DefaultUrlSerializer() },
      ],
    });

    return {
      angularLocation,
      browserLocation,
      customElementRegistry,
      handler: TestBed.inject(RouterlessLinkHandler),
    };
  }

  function defaultOptions(overrides?: Partial<NavigationBehaviorOptions>): NavigationBehaviorOptions {
    return {
      browserUrl: undefined,
      info: undefined,
      replaceUrl: false,
      skipLocationChange: false,
      state: undefined,
      ...overrides,
    };
  }

  function runWithProdMode(callback: () => void): void {
    const global = globalThis as Record<string, unknown>;
    const originalNgDevMode = global['ngDevMode'];
    global['ngDevMode'] = false;
    try {
      callback();
    } finally {
      global['ngDevMode'] = originalNgDevMode;
    }
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves the default LinkHandler token to RouterlessLinkHandler', () => {
    const { handler } = setup();

    expect(TestBed.inject(LinkHandler)).toBe(handler);
  });

  describe('prepareLink', () => {
    it('serializes commands into prepared links with attributes', () => {
      const { angularLocation, handler } = setup();
      const attributes: LinkAttributes = { rel: 'noopener', target: '_blank' };

      const link = handler.prepareLink({ command: '/next' }, undefined, attributes);

      expect(link).toEqual({
        href: '/base/next',
        attributes,
        isAnchorLikeElement: false,
      });
      expect(angularLocation.prepareExternalUrl).toHaveBeenCalledWith('/next');
    });

    it('marks native anchor hosts as anchor-like', () => {
      const { handler } = setup();

      const link = handler.prepareLink({ command: '/next' }, { tagName: 'A' } as Element);

      expect(link.isAnchorLikeElement).toBe(true);
    });

    it('marks custom elements that observe href as anchor-like', () => {
      const { customElementRegistry, handler } = setup();
      customElementRegistry.get.mockReturnValue({ observedAttributes: ['href'] });

      const link = handler.prepareLink({ command: '/next' }, { tagName: 'x-link' } as Element);

      expect(link.isAnchorLikeElement).toBe(true);
      expect(customElementRegistry.get).toHaveBeenCalledWith('x-link');
    });
  });

  describe('navigateTo', () => {
    function preparedLink(isAnchorLikeElement = false): RouterlessPreparedLink {
      return {
        href: '/base/next',
        isAnchorLikeElement,
      };
    }

    it('allows native navigation for anchor-like elements', () => {
      const { browserLocation, handler } = setup();

      const shouldContinueNativeNavigation = handler.navigateTo(
        preparedLink(true),
        new Event('click'),
        defaultOptions(),
      );

      expect(shouldContinueNativeNavigation).toBe(true);
      expect(browserLocation.assign).not.toHaveBeenCalled();
      expect(browserLocation.replace).not.toHaveBeenCalled();
    });

    it('assigns browser location for non-anchor hosts', () => {
      const { browserLocation, handler } = setup();

      const shouldContinueNativeNavigation = handler.navigateTo(preparedLink(), new Event('click'), defaultOptions());

      expect(shouldContinueNativeNavigation).toBe(false);
      expect(browserLocation.assign).toHaveBeenCalledWith('/base/next');
      expect(browserLocation.replace).not.toHaveBeenCalled();
    });

    it.each(['javascript:alert(1)', 'data:text/html,<p>x</p>'])('does not navigate to the unsafe URL %s', (href) => {
      const { browserLocation, handler } = setup();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      const shouldContinueNativeNavigation = handler.navigateTo(
        { href, isAnchorLikeElement: false },
        new Event('click'),
        defaultOptions({ replaceUrl: href.startsWith('data:') }),
      );

      expect(shouldContinueNativeNavigation).toBe(false);
      expect(browserLocation.assign).not.toHaveBeenCalled();
      expect(browserLocation.replace).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(`Refusing to navigate to the unsafe URL "${href}".`);
    });

    it('does not warn about unsafe URLs in production mode', () => {
      const { browserLocation, handler } = setup();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      runWithProdMode(() => {
        handler.navigateTo(
          { href: 'javascript:alert(1)', isAnchorLikeElement: false },
          new Event('click'),
          defaultOptions(),
        );
      });

      expect(browserLocation.assign).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('replaces browser location when replaceUrl is true', () => {
      const { browserLocation, handler } = setup();

      const shouldContinueNativeNavigation = handler.navigateTo(
        preparedLink(),
        new Event('click'),
        defaultOptions({ replaceUrl: true }),
      );

      expect(shouldContinueNativeNavigation).toBe(false);
      expect(browserLocation.replace).toHaveBeenCalledWith('/base/next');
      expect(browserLocation.assign).not.toHaveBeenCalled();
    });

    it('warns in dev mode when router-only options are provided', () => {
      const { handler } = setup();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      handler.navigateTo(
        preparedLink(),
        new Event('click'),
        defaultOptions({
          browserUrl: '/shadow',
          skipLocationChange: true,
          state: { from: 'test' },
        }),
      );

      expect(warnSpy).toHaveBeenCalledWith(
        'The "skipLocationChange" option is not supported in routerless navigation.',
      );
      expect(warnSpy).toHaveBeenCalledWith('The "state" option is not supported in routerless navigation.');
      expect(warnSpy).toHaveBeenCalledWith('The "browserUrl" option is not supported in routerless navigation.');
    });

    it('does not warn in production mode for unsupported router-only options', () => {
      const { handler } = setup();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      runWithProdMode(() => {
        handler.navigateTo(
          preparedLink(),
          new Event('click'),
          defaultOptions({
            browserUrl: '/shadow',
            skipLocationChange: true,
            state: { from: 'test' },
          }),
        );
      });

      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('isActive', () => {
    function preparedLink(href: string): RouterlessPreparedLink {
      return {
        href,
        isAnchorLikeElement: false,
      };
    }

    it('uses subset matching while ignoring fragments and matrix parameters by default', () => {
      const { handler } = setup('/current;view=details/child?existing=1&extra=2#current');

      const active = handler.isActive(preparedLink('/current;view=summary?existing=1#target'));

      expect(active()).toBe(true);
    });

    it('returns false when the prepared link does not match the browser location', () => {
      const { handler } = setup('/current/child?existing=1');

      const active = handler.isActive(preparedLink('/other'));

      expect(active()).toBe(false);
    });

    it.each([
      ['paths', { paths: 'exact' }],
      ['query parameters', { queryParams: 'exact' }],
      ['fragments', { fragment: 'exact' }],
      ['matrix parameters', { matrixParams: 'exact' }],
    ] satisfies [string, Partial<IsActiveMatchOptions>][])(
      'applies partial options for exact %s matching',
      (_name, options) => {
        const { handler } = setup('/current;view=details/child?existing=1&extra=2#current');
        const link = preparedLink('/current;view=summary?existing=1#target');

        expect(handler.isActive(link, options)()).toBe(false);
      },
    );

    it.each(['popstate', 'hashchange'])('updates when the window dispatches %s', (type) => {
      const { browserLocation, handler } = setup('/current');
      const active = handler.isActive(preparedLink('/other'));
      expect(active()).toBe(false);

      browserLocation.href = '/other';
      window.dispatchEvent(new Event(type));

      expect(active()).toBe(true);
    });

    it('updates after its own navigations', () => {
      const { browserLocation, handler } = setup('/current');
      browserLocation.assign.mockImplementation((url) => {
        browserLocation.href = String(url);
      });
      const active = handler.isActive(preparedLink('/current#section'), { fragment: 'exact' });
      expect(active()).toBe(false);

      handler.navigateTo(preparedLink('/current#section'), new Event('click'), defaultOptions());

      expect(active()).toBe(true);
    });

    it('updates on Navigation API current entry changes when supported', () => {
      const navigation = new EventTarget() as Navigation;
      TestBed.configureTestingModule({
        providers: [{ provide: NAVIGATION, useValue: navigation }],
      });
      const { browserLocation, handler } = setup('/current');
      const active = handler.isActive(preparedLink('/other'));

      browserLocation.href = '/other';
      navigation.dispatchEvent(new Event('currententrychange'));

      expect(active()).toBe(true);
      TestBed.resetTestingModule();
      browserLocation.href = '/current';
      navigation.dispatchEvent(new Event('currententrychange'));
      expect(active()).toBe(true);
    });

    it('removes its listeners when the injector is destroyed', () => {
      const removeSpy = vi.spyOn(window, 'removeEventListener');
      setup();

      TestBed.resetTestingModule();

      expect(removeSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
      expect(removeSpy).toHaveBeenCalledWith('hashchange', expect.any(Function));
    });

    it('does not track URL changes without a window', () => {
      TestBed.configureTestingModule({
        providers: [
          { provide: WINDOW, useValue: undefined },
          { provide: NAVIGATION, useValue: undefined },
        ],
      });
      const { browserLocation, handler } = setup('/current');
      const active = handler.isActive(preparedLink('/current'));

      browserLocation.href = '/other';
      window.dispatchEvent(new Event('popstate'));

      expect(active()).toBe(true);
    });

    it('compares against the injected browser location href', () => {
      const { angularLocation, browserLocation, handler } = setup('/browser/path');
      angularLocation.path.mockReturnValue('/angular/path');
      browserLocation.href = '/browser/path';

      expect(handler.isActive(preparedLink('/browser/path'), { paths: 'exact' })()).toBe(true);
      expect(handler.isActive(preparedLink('/angular/path'), { paths: 'exact' })()).toBe(false);
    });
  });
});
