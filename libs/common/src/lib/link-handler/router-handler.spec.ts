import { Location } from '@angular/common';
import { ErrorHandler, Injector, signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  type ActivatedRoute,
  DefaultUrlSerializer,
  type IsActiveMatchOptions,
  type NavigationBehaviorOptions,
  Router,
  UrlSerializer,
  UrlTree,
} from '@angular/router';
import { CUSTOM_ELEMENT_REGISTRY, LOCATION } from '@atlasng/core';
import { type LinkAttributes } from './handler';
import { RouterLinkHandler, type RouterPreparedLink } from './router-handler';
import { RouterlessLinkHandler } from './routerless-handler';

describe('RouterLinkHandler', () => {
  const BASE_URL = 'https://example.com/page';

  interface TestRouter {
    createUrlTree: ReturnType<typeof vi.fn<(commands: readonly unknown[], options?: unknown) => UrlTree>>;
    lastSuccessfulNavigation: ReturnType<typeof vi.fn<() => { finalUrl: UrlTree }>>;
    navigateByUrl: ReturnType<typeof vi.fn<(tree: UrlTree, options?: NavigationBehaviorOptions) => Promise<boolean>>>;
    routerState: { root: ActivatedRoute };
    serializeUrl: ReturnType<typeof vi.fn<(tree: UrlTree) => string>>;
  }

  interface TestContext {
    activeUrl: WritableSignal<UrlTree>;
    angularLocation: {
      path: ReturnType<typeof vi.fn<(includeHash?: boolean) => string>>;
      prepareExternalUrl: ReturnType<typeof vi.fn<(url: string) => string>>;
    };
    browserLocation: {
      assign: ReturnType<typeof vi.fn<(url: string | URL) => void>>;
      replace: ReturnType<typeof vi.fn<(url: string | URL) => void>>;
    };
    customElementRegistry: { get: ReturnType<typeof vi.fn> };
    errorHandler: { handleError: ReturnType<typeof vi.fn> };
    handler: RouterLinkHandler;
    router: TestRouter;
    routerlessHandler: RouterlessLinkHandler;
    urlSerializer: UrlSerializer;
  }

  function setup(currentUrl = '/current/path'): TestContext {
    const urlSerializer = new DefaultUrlSerializer();
    const rootRoute = {} as ActivatedRoute;
    const activeUrl = signal(urlSerializer.parse(currentUrl));
    const router: TestRouter = {
      createUrlTree: vi.fn((commands: readonly unknown[]) => urlSerializer.parse(`/${commands.join('/')}`)),
      lastSuccessfulNavigation: vi.fn(() => ({ finalUrl: activeUrl() })),
      navigateByUrl: vi.fn().mockResolvedValue(true),
      routerState: { root: rootRoute },
      serializeUrl: vi.fn((tree: UrlTree) => urlSerializer.serialize(tree)),
    };
    const angularLocation = {
      path: vi.fn().mockReturnValue('/current/path?existing=1#old'),
      prepareExternalUrl: vi.fn((url: string) => `/base${url}`),
    };
    const browserLocation = {
      assign: vi.fn(),
      replace: vi.fn(),
    };
    const customElementRegistry = {
      get: vi.fn().mockReturnValue(undefined),
    };
    const errorHandler = {
      handleError: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        RouterLinkHandler,
        { provide: CUSTOM_ELEMENT_REGISTRY, useValue: customElementRegistry },
        { provide: ErrorHandler, useValue: errorHandler },
        { provide: LOCATION, useValue: browserLocation },
        { provide: Location, useValue: angularLocation },
        { provide: Router, useValue: router },
        { provide: UrlSerializer, useValue: urlSerializer },
      ],
    });

    return {
      activeUrl,
      angularLocation,
      browserLocation,
      customElementRegistry,
      errorHandler,
      handler: TestBed.inject(RouterLinkHandler),
      router,
      routerlessHandler: TestBed.inject(RouterlessLinkHandler),
      urlSerializer,
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

  function preparedLink(overrides?: Partial<RouterPreparedLink>): RouterPreparedLink {
    return {
      href: '/base/route',
      isAnchorLikeElement: false,
      urlTree: new UrlTree(),
      ...overrides,
    };
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('prepareLink', () => {
    it('delegates absolute URLs to the routerless handler', () => {
      const { handler } = setup();
      const attributes: LinkAttributes = { target: '_blank' };

      const link = handler.prepareLink(
        {
          command: `${BASE_URL}?existing=1#old`,
          fragment: 'next',
          queryParams: { existing: '2', extra: ['a', 'b'] },
          queryParamsHandling: 'merge',
        },
        undefined,
        attributes,
      );

      expect(link).toEqual({
        href: `${BASE_URL}?existing=2&extra=a&extra=b#next`,
        attributes,
        isAnchorLikeElement: false,
      });
    });

    it('uses UrlTree commands directly', () => {
      const { handler, router, urlSerializer } = setup();
      const urlTree = urlSerializer.parse('/direct?x=1#hash');

      const link = handler.prepareLink({ command: urlTree });

      expect(link.href).toBe('/base/direct?x=1#hash');
      expect(link.urlTree).toBe(urlTree);
      expect(router.createUrlTree).not.toHaveBeenCalled();
    });

    it('creates UrlTrees for command arrays using router state from the injector when needed', () => {
      const { handler, router } = setup();
      const rootRoute = {} as ActivatedRoute;
      const injector = {
        get: vi.fn().mockReturnValue({ routerState: { root: rootRoute } }),
      } as unknown as Injector;

      handler.prepareLink({ command: ['team', '42'] }, undefined, undefined, injector);

      expect(injector.get).toHaveBeenCalledWith(Router);
      expect(router.createUrlTree).toHaveBeenCalledWith(
        ['team', '42'],
        expect.objectContaining({ relativeTo: rootRoute }),
      );
    });

    it('prefers command relativeTo over injector router state', () => {
      const { handler, router } = setup();
      const commandRelativeTo = {} as ActivatedRoute;
      const injector = {
        get: vi.fn(),
      } as unknown as Injector;

      handler.prepareLink({ command: ['team', '42'], relativeTo: commandRelativeTo }, undefined, undefined, injector);

      expect(injector.get).not.toHaveBeenCalled();
      expect(router.createUrlTree).toHaveBeenCalledWith(
        ['team', '42'],
        expect.objectContaining({ relativeTo: commandRelativeTo }),
      );
    });

    it('sets anchor-like metadata from the host element', () => {
      const { customElementRegistry, handler } = setup();
      customElementRegistry.get.mockReturnValue({ observedAttributes: ['href'] });

      const link = handler.prepareLink({ command: '/route' }, { tagName: 'x-link' } as Element);

      expect(link.isAnchorLikeElement).toBe(true);
      expect(customElementRegistry.get).toHaveBeenCalledWith('x-link');
    });
  });

  describe('navigateTo', () => {
    it('delegates links without UrlTrees to the routerless handler', () => {
      const { browserLocation, handler, router } = setup();

      const shouldContinueNativeNavigation = handler.navigateTo(
        preparedLink({ urlTree: undefined }),
        new Event('click'),
        defaultOptions(),
      );

      expect(shouldContinueNativeNavigation).toBe(false);
      expect(browserLocation.assign).toHaveBeenCalledWith('/base/route');
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it.each([
      ['non-primary button', new MouseEvent('click', { button: 1 })],
      ['alt key', new MouseEvent('click', { altKey: true })],
      ['ctrl key', new MouseEvent('click', { ctrlKey: true })],
      ['meta key', new MouseEvent('click', { metaKey: true })],
      ['shift key', new MouseEvent('click', { shiftKey: true })],
    ])('preserves native navigation for anchor clicks with %s', (_name, event) => {
      const { handler, router } = setup();

      const shouldContinueNativeNavigation = handler.navigateTo(
        preparedLink({ isAnchorLikeElement: true }),
        event,
        defaultOptions(),
      );

      expect(shouldContinueNativeNavigation).toBe(true);
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('preserves native navigation for non-self anchor targets', () => {
      const { handler, router } = setup();

      const shouldContinueNativeNavigation = handler.navigateTo(
        preparedLink({ attributes: { target: '_blank' }, isAnchorLikeElement: true }),
        new MouseEvent('click'),
        defaultOptions(),
      );

      expect(shouldContinueNativeNavigation).toBe(true);
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('preserves native navigation for anchor downloads', () => {
      const { handler, router } = setup();

      const shouldContinueNativeNavigation = handler.navigateTo(
        preparedLink({ attributes: { download: 'report.csv' }, isAnchorLikeElement: true }),
        new MouseEvent('click'),
        defaultOptions(),
      );

      expect(shouldContinueNativeNavigation).toBe(true);
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('navigates with the router and returns false for anchor-like hosts', () => {
      const { handler, router, urlSerializer } = setup();
      const urlTree = urlSerializer.parse('/route/123');

      const shouldContinueNativeNavigation = handler.navigateTo(
        preparedLink({
          attributes: { target: '_self' },
          isAnchorLikeElement: true,
          urlTree,
        }),
        new MouseEvent('click'),
        defaultOptions({ replaceUrl: true }),
      );

      expect(router.navigateByUrl).toHaveBeenCalledWith(urlTree, expect.objectContaining({ replaceUrl: true }));
      expect(shouldContinueNativeNavigation).toBe(false);
    });

    it('navigates with the router and returns true for non-anchor hosts', () => {
      const { handler, router, urlSerializer } = setup();
      const urlTree = urlSerializer.parse('/route/123');

      const shouldContinueNativeNavigation = handler.navigateTo(
        preparedLink({ urlTree }),
        new Event('click'),
        defaultOptions(),
      );

      expect(router.navigateByUrl).toHaveBeenCalledWith(urlTree, expect.any(Object));
      expect(shouldContinueNativeNavigation).toBe(true);
    });

    it('forwards router navigation errors to ErrorHandler', async () => {
      const { errorHandler, handler, router, urlSerializer } = setup();
      const urlTree = urlSerializer.parse('/route/fail');
      const error = new Error('navigation failed');
      router.navigateByUrl.mockRejectedValueOnce(error);

      handler.navigateTo(preparedLink({ urlTree }), new Event('click'), defaultOptions());
      await Promise.resolve();

      expect(errorHandler.handleError).toHaveBeenCalledWith(error);
    });
  });

  describe('isActive', () => {
    it('reactively matches router links against the last successful navigation', () => {
      const { activeUrl, handler, router, urlSerializer } = setup('/team/42?view=details');
      const link = preparedLink({ urlTree: urlSerializer.parse('/team?view=details') });

      const active = handler.isActive(link);

      expect(active()).toBe(true);

      activeUrl.set(urlSerializer.parse('/other'));

      expect(active()).toBe(false);
      expect(router.lastSuccessfulNavigation).toHaveBeenCalled();
    });

    it('applies partial router match options', () => {
      const { handler, urlSerializer } = setup('/team?view=details#current');
      const link = preparedLink({ urlTree: urlSerializer.parse('/team?view=summary#target') });
      const ignoredOptions: Partial<IsActiveMatchOptions> = {
        fragment: 'ignored',
        paths: 'exact',
        queryParams: 'ignored',
      };
      const exactFragmentOptions: Partial<IsActiveMatchOptions> = {
        ...ignoredOptions,
        fragment: 'exact',
      };

      expect(handler.isActive(link, ignoredOptions)()).toBe(true);
      expect(handler.isActive(link, exactFragmentOptions)()).toBe(false);
    });

    it('delegates links without UrlTrees to the routerless handler', () => {
      const { handler, routerlessHandler } = setup();
      const matchOptions: Partial<IsActiveMatchOptions> = { paths: 'exact' };
      const delegatedSignal = signal(true);
      const isActiveSpy = vi.spyOn(routerlessHandler, 'isActive').mockReturnValue(delegatedSignal);
      const link = preparedLink({ urlTree: undefined });

      const active = handler.isActive(link, matchOptions);

      expect(active).toBe(delegatedSignal);
      expect(isActiveSpy).toHaveBeenCalledWith(link, matchOptions);
    });
  });
});
