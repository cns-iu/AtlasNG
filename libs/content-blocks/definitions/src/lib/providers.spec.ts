import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ContentDefinition } from '@atlasng/content-blocks/types';
import { DefinitionRegistry } from './definition-registry';
import { provideDefinitions } from './providers';

class TestComponent {}

const first: ContentDefinition = { name: 'first', component: TestComponent };
const second: ContentDefinition = { name: 'second', component: TestComponent };

describe('provideDefinitions', () => {
  it('registers an array of definitions under their names', async () => {
    TestBed.configureTestingModule({ providers: [provideDefinitions([first, second])] });
    const registry = TestBed.inject(DefinitionRegistry);

    await expect(registry.get('first')).resolves.toBe(first);
    await expect(registry.get('second')).resolves.toBe(second);
  });

  it('registers factories under their keys', async () => {
    TestBed.configureTestingModule({ providers: [provideDefinitions({ alias: async () => first })] });

    await expect(TestBed.inject(DefinitionRegistry).get('alias')).resolves.toBe(first);
  });

  it('merges definitions from several calls', async () => {
    TestBed.configureTestingModule({ providers: [provideDefinitions([first]), provideDefinitions([second])] });
    const registry = TestBed.inject(DefinitionRegistry);

    await expect(registry.get('first')).resolves.toBe(first);
    await expect(registry.get('second')).resolves.toBe(second);
  });

  it('adds definitions in a child injector on top of the parent', async () => {
    TestBed.configureTestingModule({ providers: [provideDefinitions([first])] });
    const child = createEnvironmentInjector([provideDefinitions([second])], TestBed.inject(EnvironmentInjector));
    const registry = child.get(DefinitionRegistry);

    expect(registry).not.toBe(TestBed.inject(DefinitionRegistry));
    await expect(registry.get('first')).resolves.toBe(first);
    await expect(registry.get('second')).resolves.toBe(second);
  });
});
