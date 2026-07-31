import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { type ActivatedRoute, DefaultUrlSerializer, UrlSegment, UrlSerializer, UrlTree } from '@angular/router';
import { RouterlessCommandSerializer } from './command-serializer';

describe('RouterlessCommandSerializer', () => {
  const BASE_URL = 'https://example.com/privacy';

  interface MockLocation {
    path: ReturnType<typeof vi.fn>;
    prepareExternalUrl: ReturnType<typeof vi.fn<(url: string) => string>>;
  }

  function setup(currentPath = '/current/child?existing=1#old'): {
    location: MockLocation;
    serializer: RouterlessCommandSerializer;
  } {
    const location = {
      path: vi.fn().mockReturnValue(currentPath),
      prepareExternalUrl: vi.fn((url: string) => `/base${url}`),
    };

    TestBed.configureTestingModule({
      providers: [
        RouterlessCommandSerializer,
        { provide: Location, useValue: location },
        { provide: UrlSerializer, useValue: new DefaultUrlSerializer() },
      ],
    });

    const serializer = TestBed.inject(RouterlessCommandSerializer);
    return { location, serializer };
  }

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  describe('serializeCommand', () => {
    it('preserves absolute URL commands', () => {
      const { location, serializer } = setup();

      const href = serializer.serializeCommand({ command: BASE_URL });

      expect(href).toBe(BASE_URL);
      expect(location.prepareExternalUrl).not.toHaveBeenCalled();
    });

    it('applies query params and fragment options to absolute URL commands', () => {
      const { serializer } = setup();

      const href = serializer.serializeCommand({
        command: `${BASE_URL}?existing=1#old`,
        queryParamsHandling: 'merge',
        queryParams: {
          existing: '2',
          add: ['a', 'b'],
        },
        fragment: 'new',
      });

      expect(href).toBe(`${BASE_URL}?existing=2&add=a&add=b#new`);
    });

    it('serializes relative commands from the current browser path', () => {
      const { location, serializer } = setup('/current/child?existing=1#old');

      const href = serializer.serializeCommand({
        command: ['..', 'sibling'],
        queryParams: { ignored: 'x' },
        queryParamsHandling: 'preserve',
        preserveFragment: true,
        fragment: 'new',
      });

      expect(location.path).toHaveBeenCalledWith(true);
      expect(href).toBe('/base/current/sibling?existing=1#old');
    });

    it('uses explicit relativeTo input without reading the current browser path', () => {
      const { location, serializer } = setup('/ignored/path');
      const relativeTo = {
        snapshot: {
          url: [new UrlSegment('docs', {}), new UrlSegment('start', {})],
          queryParams: { existing: '1' },
          fragment: 'section',
        },
      } as unknown as ActivatedRoute;

      const href = serializer.serializeCommand({
        command: ['child'],
        relativeTo,
        queryParamsHandling: 'preserve',
        preserveFragment: true,
      });

      expect(location.path).not.toHaveBeenCalled();
      expect(href).toBe('/base/docs/start/child?existing=1#section');
    });

    it('supports UrlTree commands without recalculating the path', () => {
      const { serializer } = setup();
      const urlTree = TestBed.inject(UrlSerializer).parse('/prebuilt?x=1#hash');

      const href = serializer.serializeCommand({ command: urlTree });

      expect(href).toBe('/base/prebuilt?x=1#hash');
    });
  });

  describe('commandToUrlTree', () => {
    it('returns existing UrlTree commands unchanged', () => {
      const { serializer } = setup();
      const urlTree = new UrlTree();

      expect(serializer.commandToUrlTree({ command: urlTree })).toBe(urlTree);
    });

    it('merges query params and preserves fragments from UrlTree relative state', () => {
      const { serializer } = setup();
      const relativeTo = TestBed.inject(UrlSerializer).parse('/docs/start?existing=1#section');

      const result = serializer.commandToUrlTree(
        {
          command: ['child'],
          queryParamsHandling: 'merge',
          queryParams: { next: '2' },
          preserveFragment: true,
        },
        relativeTo,
      );

      expect(TestBed.inject(UrlSerializer).serialize(result)).toBe('/docs/start/child?existing=1&next=2#section');
    });

    it('uses an empty path when UrlTree relative state has no primary outlet', () => {
      const { serializer } = setup();
      const relativeTo = new UrlTree(undefined, { existing: '1' }, 'root');

      const result = serializer.commandToUrlTree(
        {
          command: ['child'],
          queryParamsHandling: 'preserve',
          preserveFragment: true,
        },
        relativeTo,
      );

      expect(TestBed.inject(UrlSerializer).serialize(result)).toBe('/child?existing=1#root');
    });

    it('uses ActivatedRoute snapshots as relative state', () => {
      const { serializer } = setup();
      const relativeTo = {
        snapshot: {
          url: [new UrlSegment('docs', {}), new UrlSegment('guide', {})],
          queryParams: { existing: '1' },
          fragment: 'intro',
        },
      } as unknown as ActivatedRoute;

      const result = serializer.commandToUrlTree(
        {
          command: ['..', 'api'],
          queryParamsHandling: 'preserve',
          preserveFragment: true,
        },
        relativeTo,
      );

      expect(TestBed.inject(UrlSerializer).serialize(result)).toBe('/docs/api?existing=1#intro');
    });

    it('replaces query params and fragment by default', () => {
      const { serializer } = setup();
      const relativeTo = TestBed.inject(UrlSerializer).parse('/current/path?existing=1#old');

      const result = serializer.commandToUrlTree(
        {
          command: '/target',
          queryParams: { next: '2' },
          fragment: 'new',
        },
        relativeTo,
      );

      expect(TestBed.inject(UrlSerializer).serialize(result)).toBe('/target?next=2#new');
    });

    it('uses empty relative state and omits a null preserved fragment when no base is provided', () => {
      const { serializer } = setup();

      const result = serializer.commandToUrlTree({
        command: 'target',
        preserveFragment: true,
      });

      expect(TestBed.inject(UrlSerializer).serialize(result)).toBe('/target');
    });
  });

  describe('commandArrayToPath', () => {
    it('normalizes empty and dot path tokens and resolves parent traversal', () => {
      const { serializer } = setup();
      const segments = [new UrlSegment('a', {}), new UrlSegment('b', {}), new UrlSegment('c', {})];

      const path = serializer.commandArrayToPath(
        ['', '.', '..', null, undefined, { segmentPath: 'next/final' }],
        segments,
      );

      expect(path).toBe('/a/b/next/final');
    });

    it('resets relative segments when the first path is absolute', () => {
      const { serializer } = setup();
      const segments = [new UrlSegment('current', {})];

      const path = serializer.commandArrayToPath(['/one', 'two'], segments);

      expect(path).toBe('/one/two');
    });

    it('returns root when parent traversal clears all segments', () => {
      const { serializer } = setup();
      const segments = [new UrlSegment('a', {})];

      const path = serializer.commandArrayToPath(['..'], segments);

      expect(path).toBe('/');
    });
  });

  describe('commandItemToPath', () => {
    it('converts primitive command items to strings', () => {
      const { serializer } = setup();

      expect(serializer.commandItemToPath('a')).toBe('a');
      expect(serializer.commandItemToPath(1)).toBe('1');
      expect(serializer.commandItemToPath(true)).toBe('true');
      expect(serializer.commandItemToPath(2n)).toBe('2');
    });

    it('uses segmentPath objects as path values', () => {
      const { serializer } = setup();

      expect(serializer.commandItemToPath({ segmentPath: 'literal/path' })).toBe('literal/path');
    });

    it('returns undefined for null and unsupported command items', () => {
      const { serializer } = setup();

      expect(serializer.commandItemToPath(null)).toBeUndefined();
      expect(serializer.commandItemToPath(undefined)).toBeUndefined();
      expect(serializer.commandItemToPath(Symbol('ignored'))).toBeUndefined();
      expect(serializer.commandItemToPath({ other: 'ignored' })).toBeUndefined();
    });

    it('skips outlets in command arrays and warns in dev mode', () => {
      const { serializer } = setup();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      expect(serializer.commandItemToPath({ outlets: { aux: 'two' } })).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(
        'Outlets in command arrays are not supported in routerless mode and will be skipped.',
      );
    });
  });
});
