import { Component, inject, Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render } from '@testing-library/angular';
import { DefaultSearchEngine } from './default-engine/default-engine';
import { SearchEngine } from './engine/search-engine';
import { provideSearch, SEARCH_CONFIG, withCustomEngine, withDefaultEngine } from './providers';

const customEngine: SearchEngine = { createIndex: () => ({ search: () => [] }) };

describe('search providers', () => {
  it('defaults to the default engine and configuration', () => {
    expect(TestBed.inject(SearchEngine)).toBe(TestBed.inject(DefaultSearchEngine));
    expect(TestBed.runInInjectionContext(() => SEARCH_CONFIG.inject())).toEqual({
      debounce: 0,
      minLength: 1,
      suggestionLimit: 10,
    });
  });

  it('provides a custom engine and configuration', () => {
    TestBed.configureTestingModule({
      providers: [
        provideSearch(
          { debounce: 200, suggestionLimit: 5 },
          withCustomEngine(() => customEngine),
        ),
      ],
    });
    expect(TestBed.inject(SearchEngine)).toBe(customEngine);
    expect(TestBed.runInInjectionContext(() => SEARCH_CONFIG.inject())).toEqual({
      debounce: 200,
      minLength: 1,
      suggestionLimit: 5,
    });
  });

  it('provides nothing without a configuration or features', () => {
    expect(provideSearch()).toEqual([]);
  });

  it('merges component configuration over its parent configuration', async () => {
    @Component({
      template: '',
      providers: [provideSearch({ minLength: 3, debounce: undefined })],
    })
    class Host {
      readonly injector = inject(Injector);
    }

    const { fixture } = await render(Host, {
      providers: [provideSearch({ debounce: 100 })],
    });
    const config = fixture.componentInstance.injector.get(SEARCH_CONFIG.token);
    expect(config).toEqual({ debounce: 100, minLength: 3 });
  });

  it('restores the default engine below a custom engine', async () => {
    @Component({
      template: '',
      providers: [provideSearch(undefined, withDefaultEngine())],
    })
    class Host {
      readonly engine = inject(SearchEngine);
    }

    const { fixture } = await render(Host, {
      providers: [
        provideSearch(
          undefined,
          withCustomEngine(() => customEngine),
        ),
      ],
    });
    expect(TestBed.inject(SearchEngine)).toBe(customEngine);
    expect(fixture.componentInstance.engine).toBe(TestBed.inject(DefaultSearchEngine));
  });

  it('throws when multiple engines are provided', () => {
    expect(() =>
      provideSearch(
        {},
        withCustomEngine(() => customEngine),
        withCustomEngine(() => customEngine),
      ),
    ).toThrow('ANG2011');
    expect(() =>
      provideSearch(
        {},
        withCustomEngine(() => customEngine),
        withDefaultEngine(),
      ),
    ).toThrow('ANG2011');
  });
});
