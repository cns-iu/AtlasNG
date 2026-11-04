import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DataLoader, DataLoaderRegistry } from './data-loader-registry';
import { provideDataLoaders } from './providers';

const first: DataLoader = { load: () => 'value' };
const second: DataLoader = { load: () => 'value' };

describe('provideDataLoaders', () => {
  it('provides a registry with the given loaders', async () => {
    TestBed.configureTestingModule({ providers: [provideDataLoaders({ http: () => first })] });

    await expect(TestBed.inject(DataLoaderRegistry).get('http')).resolves.toBe(first);
  });

  it('merges loaders from several calls', async () => {
    TestBed.configureTestingModule({
      providers: [provideDataLoaders({ a: () => first }), provideDataLoaders({ b: () => second })],
    });
    const registry = TestBed.inject(DataLoaderRegistry);

    await expect(registry.get('a')).resolves.toBe(first);
    await expect(registry.get('b')).resolves.toBe(second);
  });

  it('adds loaders in a child injector on top of the parent', async () => {
    TestBed.configureTestingModule({ providers: [provideDataLoaders({ a: () => first })] });
    const child = createEnvironmentInjector(
      [provideDataLoaders({ b: () => second })],
      TestBed.inject(EnvironmentInjector),
    );
    const registry = child.get(DataLoaderRegistry);

    expect(registry).not.toBe(TestBed.inject(DataLoaderRegistry));
    await expect(registry.get('a')).resolves.toBe(first);
    await expect(registry.get('b')).resolves.toBe(second);
  });
});
