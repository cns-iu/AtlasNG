import { MediaMatcher } from '@angular/cdk/layout';
import { EnvironmentInjector, Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  BREAKPOINTS,
  breakpointQuery,
  provideBreakpoints,
  watchActiveBreakpoint,
  watchBreakpoint,
} from './breakpoints';

class FakeMediaQueryList {
  readonly listeners = new Set<(event: { matches: boolean }) => void>();

  constructor(
    readonly media: string,
    private readonly viewport: FakeMediaMatcher,
  ) {}

  get matches(): boolean {
    const min = /min-width: ([\d.]+)px/.exec(this.media);
    const max = /max-width: ([\d.]+)px/.exec(this.media);
    const width = this.viewport.width;
    return (!min || width >= Number(min[1])) && (!max || width <= Number(max[1]));
  }

  addListener(listener: (event: { matches: boolean }) => void): void {
    this.listeners.add(listener);
  }

  removeListener(listener: (event: { matches: boolean }) => void): void {
    this.listeners.delete(listener);
  }
}

class FakeMediaMatcher {
  width = 0;
  readonly queries = new Map<string, FakeMediaQueryList>();

  matchMedia(query: string): FakeMediaQueryList {
    const mql = new FakeMediaQueryList(query, this);
    this.queries.set(query, mql);
    return mql;
  }

  async resize(width: number): Promise<void> {
    this.width = width;
    for (const mql of this.queries.values()) {
      mql.listeners.forEach((listener) => listener({ matches: mql.matches }));
    }
    await new Promise((resolve) => setTimeout(resolve));
  }
}

describe('breakpointQuery', () => {
  it.each([
    ['x-small', ''],
    ['x-small only', '(max-width: 599.98px)'],
    ['x-small down', '(max-width: 599.98px)'],
    ['medium', '(min-width: 960px)'],
    ['medium up', '(min-width: 960px)'],
    ['medium only', '(min-width: 960px) and (max-width: 1279.98px)'],
    ['medium down', '(max-width: 1279.98px)'],
    ['x-large only', '(min-width: 1920px)'],
    ['x-large down', ''],
    [700, '(min-width: 700px)'],
    ['700px down', '(max-width: 700px)'],
    ['40em', '(min-width: 40em)'],
    ['0 down', '(max-width: 0)'],
  ])('converts %s to "%s"', (expression, query) => {
    expect(breakpointQuery(expression)).toBe(query);
  });

  it('supports relative units', () => {
    const breakpoints = { small: 0, large: '60em' } as const;

    expect(breakpointQuery('small only', breakpoints)).toBe('(max-width: 59.99875em)');
    expect(breakpointQuery('large', breakpoints)).toBe('(min-width: 60em)');
  });

  it.each([
    ['medium only extra', /Invalid breakpoint expression/],
    ['medium sideways', /Invalid breakpoint direction/],
    ['huge', /Invalid breakpoint: huge/],
    ['600px only', /Only named breakpoints/],
  ])('rejects %s', (expression, error) => {
    expect(() => breakpointQuery(expression)).toThrow(error);
  });
});

describe('provideBreakpoints', () => {
  it('provides custom breakpoints', () => {
    const breakpoints = { mobile: 0, desktop: 1024 };
    TestBed.configureTestingModule({ providers: [provideBreakpoints(breakpoints)] });

    expect(TestBed.inject(BREAKPOINTS)).toBe(breakpoints);
  });

  it.each([
    [{}, /at least one breakpoint/],
    [{ small: 600 }, /must begin at 0/],
    [{ small: 0, medium: '40em', large: '1280px' }, /mutually comparable units/],
    [{ small: 0, medium: 960, large: 600 }, /ascending width/],
    [{ small: 0, medium: '960vw' }, /must use px, em, or rem/],
  ])('rejects invalid breakpoints %o', (breakpoints, error) => {
    expect(() => provideBreakpoints(breakpoints as never)).toThrow(error);
  });
});

function setupMediaMatcher(): FakeMediaMatcher {
  const mediaMatcher = new FakeMediaMatcher();
  TestBed.configureTestingModule({
    providers: [{ provide: MediaMatcher, useValue: mediaMatcher }],
  });
  return mediaMatcher;
}

describe('watchBreakpoint', () => {
  let mediaMatcher: FakeMediaMatcher;

  beforeEach(() => {
    mediaMatcher = setupMediaMatcher();
  });

  it('tracks a single expression', async () => {
    const isMedium = TestBed.runInInjectionContext(() => watchBreakpoint('medium only'));
    expect(isMedium()).toBe(false);

    await mediaMatcher.resize(1000);
    expect(isMedium()).toBe(true);

    await mediaMatcher.resize(1280);
    expect(isMedium()).toBe(false);
  });

  it('matches when any expression matches', async () => {
    const matches = TestBed.runInInjectionContext(() => watchBreakpoint(['small down', 'x-large']));
    expect(matches()).toBe(true);

    await mediaMatcher.resize(1500);
    expect(matches()).toBe(false);

    await mediaMatcher.resize(2000);
    expect(matches()).toBe(true);
  });

  it('is always true for expressions covering every width', () => {
    const matches = TestBed.runInInjectionContext(() => watchBreakpoint('x-small'));

    expect(matches()).toBe(true);
    expect(mediaMatcher.queries.size).toBe(0);
  });

  it('uses provided breakpoints', async () => {
    TestBed.overrideProvider(BREAKPOINTS, { useValue: { mobile: 0, desktop: 1024 } });
    const isDesktop = TestBed.runInInjectionContext(() => watchBreakpoint('desktop'));

    await mediaMatcher.resize(1024);
    expect(isDesktop()).toBe(true);
  });

  it('accepts an explicit injector', () => {
    const injector = TestBed.inject(Injector);

    expect(watchBreakpoint('medium', { injector })()).toBe(false);
  });

  it('requires an injection context without an injector', () => {
    expect(() => watchBreakpoint('medium')).toThrow();
  });

  it('requires at least one expression', () => {
    expect(() => TestBed.runInInjectionContext(() => watchBreakpoint([]))).toThrow(/at least one/);
  });
});

describe('watchActiveBreakpoint', () => {
  let mediaMatcher: FakeMediaMatcher;

  beforeEach(() => {
    mediaMatcher = setupMediaMatcher();
  });

  it('tracks the active breakpoint', async () => {
    const active = TestBed.runInInjectionContext(() => watchActiveBreakpoint());
    expect(active()).toBe('x-small');

    await mediaMatcher.resize(960);
    expect(active()).toBe('medium');

    await mediaMatcher.resize(5000);
    expect(active()).toBe('x-large');

    await mediaMatcher.resize(599);
    expect(active()).toBe('x-small');
  });

  it('handles a single breakpoint', () => {
    TestBed.overrideProvider(BREAKPOINTS, { useValue: { all: 0 } });
    const active = runInInjectionContext(TestBed.inject(EnvironmentInjector), () => watchActiveBreakpoint());

    expect(active()).toBe('all');
  });
});
