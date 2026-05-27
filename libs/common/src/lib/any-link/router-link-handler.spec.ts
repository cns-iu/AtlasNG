import { Location } from '@angular/common';
import { ErrorHandler, Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  DefaultUrlSerializer,
  NavigationBehaviorOptions,
  Router,
  UrlSerializer,
  UrlTree,
} from '@angular/router';
import { CUSTOM_ELEMENT_REGISTRY, LOCATION } from '@atlasng/core';
import { RouterLinkHandler } from './router-link-handler';

describe('RouterLinkHandler', () => {
  let handler: RouterLinkHandler;
  let router: {
    createUrlTree: ReturnType<typeof vi.fn>;
    serializeUrl: ReturnType<typeof vi.fn<(tree: UrlTree) => string>>;
    navigateByUrl: ReturnType<typeof vi.fn<(tree: UrlTree, options?: NavigationBehaviorOptions) => Promise<boolean>>>;
  };
  let angularLocation: {
    prepareExternalUrl: ReturnType<typeof vi.fn<(url: string) => string>>;
    path: ReturnType<typeof vi.fn<(includeHash?: boolean) => string>>;
  };
  let browserLocation: {
    assign: ReturnType<typeof vi.fn<(url: string | URL) => void>>;
    replace: ReturnType<typeof vi.fn<(url: string | URL) => void>>;
  };
  let errorHandler: {
    handleError: ReturnType<typeof vi.fn>;
  };

  function configureTestingModule(): void {
    const serializer = new DefaultUrlSerializer();

    router = {
      createUrlTree: vi.fn((commands: readonly unknown[]) => serializer.parse(`/${commands.join('/')}`)),
      serializeUrl: vi.fn((tree: UrlTree) => serializer.serialize(tree)),
      navigateByUrl: vi.fn().mockResolvedValue(true),
    };

    angularLocation = {
      prepareExternalUrl: vi.fn((url: string) => `/base${url}`),
      path: vi.fn().mockReturnValue('/current/path?existing=1#old'),
    };

    browserLocation = {
      assign: vi.fn(),
      replace: vi.fn(),
    };

    errorHandler = {
      handleError: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        RouterLinkHandler,
        { provide: Router, useValue: router },
        { provide: Location, useValue: angularLocation },
        { provide: LOCATION, useValue: browserLocation },
        { provide: CUSTOM_ELEMENT_REGISTRY, useValue: { get: vi.fn().mockReturnValue(undefined) } },
        { provide: UrlSerializer, useValue: serializer },
        { provide: ErrorHandler, useValue: errorHandler },
      ],
    });

    handler = TestBed.inject(RouterLinkHandler);
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

  describe('prepareLink', () => {
    it('should prepare absolute URLs and merge query params and fragment', () => {
      configureTestingModule();

      const link = handler.prepareLink({
        command: 'https://example.com/page?existing=1#old',
        queryParamsHandling: 'merge',
        queryParams: {
          existing: '2',
          extra: ['a', 'b'],
        },
        fragment: 'next',
      });

      expect(link.href).toBe('https://example.com/page?existing=2&extra=a&extra=b#next');
      expect(link.handlerContext.urlTree).toBeUndefined();
    });

    it('should replace existing search params when query params are provided without queryParamsHandling', () => {
      configureTestingModule();

      const link = handler.prepareLink({
        command: 'https://example.com/page?existing=1',
        queryParams: { param: 'value' },
      });

      expect(link.href).toBe('https://example.com/page?param=value');
    });

    it('should keep the original fragment when preserveFragment is true', () => {
      configureTestingModule();

      const link = handler.prepareLink({
        command: 'https://example.com/page#old',
        preserveFragment: true,
        fragment: 'new',
      });

      expect(link.href).toBe('https://example.com/page#old');
    });

    it('should use UrlTree commands directly', () => {
      configureTestingModule();
      const serializer = TestBed.inject(UrlSerializer);
      const urlTree = serializer.parse('/direct?x=1#hash');

      const link = handler.prepareLink({ command: urlTree });

      expect(link.href).toBe('/base/direct?x=1#hash');
      expect(link.handlerContext.urlTree).toBe(urlTree);
      expect(router.createUrlTree).not.toHaveBeenCalled();
    });

    it('should create UrlTree with relativeTo from injector when missing in command', () => {
      configureTestingModule();
      const route = {} as ActivatedRoute;
      const injector = {
        get: vi.fn().mockReturnValue(route),
      } as unknown as Injector;

      handler.prepareLink({ command: ['team', '42'] }, undefined, undefined, injector);

      expect(injector.get).toHaveBeenCalledWith(ActivatedRoute, null);
      expect(router.createUrlTree).toHaveBeenCalledWith(['team', '42'], expect.objectContaining({ relativeTo: route }));
    });

    it('should prefer command relativeTo over injector relativeTo', () => {
      configureTestingModule();
      const commandRelativeTo = {} as ActivatedRoute;
      const injector = {
        get: vi.fn().mockReturnValue({} as ActivatedRoute),
      } as unknown as Injector;

      handler.prepareLink({ command: ['team', '42'], relativeTo: commandRelativeTo }, undefined, undefined, injector);

      expect(injector.get).not.toHaveBeenCalled();
      expect(router.createUrlTree).toHaveBeenCalledWith(
        ['team', '42'],
        expect.objectContaining({ relativeTo: commandRelativeTo }),
      );
    });

    it('should warn when relativeTo is used with an absolute URL command', () => {
      configureTestingModule();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      handler.prepareLink({
        command: 'https://example.com/page',
        relativeTo: {} as ActivatedRoute,
      });

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.lastCall?.[0]).toMatchInlineSnapshot(
        `"The "relativeTo" option is not supported for absolute URLs in RouterLinkHandler."`,
      );
    });

    it('should not warn about relativeTo with absolute URL command in production mode', () => {
      configureTestingModule();
      const restoreProdMode = enableProdMode();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      handler.prepareLink({
        command: 'https://example.com/page',
        relativeTo: {} as ActivatedRoute,
      });

      expect(warnSpy).not.toHaveBeenCalled();
      restoreProdMode();
    });
  });

  describe('navigateTo', () => {
    it('should delegate to RouterlessLinkHandler when urlTree is not present', () => {
      configureTestingModule();

      const shouldContinueNativeNavigation = handler.navigateTo(
        {
          href: '/base/next',
          handlerContext: {
            isAnchorLikeElement: false,
          },
        },
        new Event('click'),
        defaultOptions(),
      );

      expect(shouldContinueNativeNavigation).toBe(false);
      expect(browserLocation.assign).toHaveBeenCalledWith('/base/next');
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should preserve native navigation for modified anchor clicks', () => {
      configureTestingModule();
      const serializer = TestBed.inject(UrlSerializer);
      const urlTree = serializer.parse('/router-only');

      const shouldContinueNativeNavigation = handler.navigateTo(
        {
          href: '/base/router-only',
          handlerContext: {
            isAnchorLikeElement: true,
            urlTree,
          },
        },
        new MouseEvent('click', { ctrlKey: true }),
        defaultOptions(),
      );

      expect(shouldContinueNativeNavigation).toBe(true);
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should preserve native navigation for non-self anchor targets', () => {
      configureTestingModule();
      const serializer = TestBed.inject(UrlSerializer);
      const urlTree = serializer.parse('/router-only');

      const shouldContinueNativeNavigation = handler.navigateTo(
        {
          href: '/base/router-only',
          attributes: { target: '_blank' },
          handlerContext: {
            isAnchorLikeElement: true,
            urlTree,
          },
        },
        new MouseEvent('click'),
        defaultOptions(),
      );

      expect(shouldContinueNativeNavigation).toBe(true);
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should navigate with the router and return false for anchor-like hosts', () => {
      configureTestingModule();
      const serializer = TestBed.inject(UrlSerializer);
      const urlTree = serializer.parse('/route/123');

      const shouldContinueNativeNavigation = handler.navigateTo(
        {
          href: '/base/route/123',
          handlerContext: {
            isAnchorLikeElement: true,
            urlTree,
          },
        },
        new MouseEvent('click'),
        defaultOptions({ replaceUrl: true }),
      );

      expect(router.navigateByUrl).toHaveBeenCalledWith(urlTree, expect.objectContaining({ replaceUrl: true }));
      expect(shouldContinueNativeNavigation).toBe(false);
    });

    it('should navigate with the router and return true for non-anchor hosts', () => {
      configureTestingModule();
      const serializer = TestBed.inject(UrlSerializer);
      const urlTree = serializer.parse('/route/123');

      const shouldContinueNativeNavigation = handler.navigateTo(
        {
          href: '/base/route/123',
          handlerContext: {
            isAnchorLikeElement: false,
            urlTree,
          },
        },
        new Event('click'),
        defaultOptions(),
      );

      expect(router.navigateByUrl).toHaveBeenCalledWith(urlTree, expect.any(Object));
      expect(shouldContinueNativeNavigation).toBe(true);
    });

    it('should forward router navigation errors to ErrorHandler', async () => {
      configureTestingModule();
      const serializer = TestBed.inject(UrlSerializer);
      const urlTree = serializer.parse('/route/fail');
      const error = new Error('navigation failed');
      router.navigateByUrl.mockRejectedValueOnce(error);

      handler.navigateTo(
        {
          href: '/base/route/fail',
          handlerContext: {
            isAnchorLikeElement: false,
            urlTree,
          },
        },
        new Event('click'),
        defaultOptions(),
      );

      await Promise.resolve();

      expect(errorHandler.handleError).toHaveBeenCalledWith(error);
    });
  });
});
