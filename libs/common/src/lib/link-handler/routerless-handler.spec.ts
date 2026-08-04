import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { DefaultUrlSerializer, UrlSerializer, type NavigationBehaviorOptions } from '@angular/router';
import { CUSTOM_ELEMENT_REGISTRY, LOCATION } from '@atlasng/core';
import { LinkHandler, type LinkAttributes } from './handler';
import { RouterlessLinkHandler, type RouterlessPreparedLink } from './routerless-handler';

describe('RouterlessLinkHandler', () => {
  interface BrowserLocation {
    assign: ReturnType<typeof vi.fn<(url: string | URL) => void>>;
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
});
