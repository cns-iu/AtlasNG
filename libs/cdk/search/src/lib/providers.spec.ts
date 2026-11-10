import { Component, inject, Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render } from '@testing-library/angular';
import { DefaultSearchEngine } from './default-engine';
import { provideSearch, SEARCH_CONFIG, SEARCH_ENGINE, withCustomEngine, withSearchConfig } from './providers';
import { SearchEngine } from './types';

const customEngine: SearchEngine = { createIndex: () => ({ search: () => [] }) };

describe('search providers', () => {
  it('defaults to the default engine and configuration', () => {
    expect(TestBed.inject(SEARCH_ENGINE)).toBe(TestBed.inject(DefaultSearchEngine));
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
          withCustomEngine(() => customEngine),
          withSearchConfig({ debounce: 200, limit: 5 }),
        ),
      ],
    });
    expect(TestBed.inject(SEARCH_ENGINE)).toBe(customEngine);
    expect(TestBed.runInInjectionContext(() => SEARCH_CONFIG.inject())).toEqual({
      debounce: 200,
      minLength: 1,
      limit: 5,
      suggestionLimit: 10,
    });
  });

  it('merges component configuration over its parent configuration', async () => {
    @Component({
      template: '',
      providers: [provideSearch(withSearchConfig({ minLength: 3, debounce: undefined }))],
    })
    class Host {
      readonly injector = inject(Injector);
    }

    const { fixture } = await render(Host, {
      providers: [provideSearch(withSearchConfig({ debounce: 100 }))],
    });
    const config = fixture.componentInstance.injector.get(SEARCH_CONFIG.token);
    expect(config).toEqual({ debounce: 100, minLength: 3 });
  });

  it('throws when multiple custom engines are provided', () => {
    expect(() =>
      provideSearch(
        withCustomEngine(() => customEngine),
        withCustomEngine(() => customEngine),
      ),
    ).toThrow('ANG2011');
  });
});
