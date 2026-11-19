import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { resolveInjector } from './injector';

describe('resolveInjector', () => {
  function injectThing(options?: { injector?: Injector }): Injector {
    return resolveInjector(injectThing, options);
  }

  it('returns the provided injector', () => {
    const injector = Injector.create({ providers: [] });

    expect(injectThing({ injector })).toBe(injector);
  });

  it('returns the injector of the current injection context', () => {
    const injector = TestBed.inject(Injector);

    expect(runInInjectionContext(injector, () => injectThing())).toBe(injector);
  });

  it('throws outside an injection context without an injector', () => {
    expect(() => injectThing()).toThrow(/injectThing/);
  });
});
