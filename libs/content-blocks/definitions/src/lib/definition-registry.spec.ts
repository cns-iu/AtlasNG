import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ContentDefinition } from '@atlasng/content-blocks/types';
import { DefinitionRegistry } from './definition-registry';
import { provideDefinitions } from './providers';

class TestComponent {}

function definition(name: string): ContentDefinition {
  return { name, component: TestComponent };
}

function setup(...definitions: Parameters<typeof provideDefinitions>[0][]): DefinitionRegistry {
  TestBed.configureTestingModule({ providers: definitions.map((entry) => provideDefinitions(entry)) });
  return TestBed.inject(DefinitionRegistry);
}

function createChild(...definitions: Parameters<typeof provideDefinitions>[0][]): DefinitionRegistry {
  const injector = createEnvironmentInjector(
    definitions.map((entry) => provideDefinitions(entry)),
    TestBed.inject(EnvironmentInjector),
  );
  return injector.get(DefinitionRegistry);
}

describe('DefinitionRegistry', () => {
  it('returns undefined for unknown definitions', () => {
    const registry = setup([]);

    expect(registry.get('missing')).toBeUndefined();
  });

  it('loads lazy definitions once', async () => {
    const load = vi.fn(async () => definition('lazy'));
    const registry = setup({ lazy: load });

    const first = await registry.get('lazy');
    const second = await registry.get('lazy');

    expect(first).toBe(second);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('treats a registered name differing from the definition name as an alias', async () => {
    const other = definition('other');
    const registry = setup({ alias: () => other });

    await expect(registry.get('alias')).resolves.toBe(other);
  });

  it('falls back to the parent registry', async () => {
    const parentDefinition = definition('parent');
    setup([parentDefinition]);
    const child = createChild([definition('child')]);

    await expect(child.get('parent')).resolves.toBe(parentDefinition);
    await expect(child.get('child')).resolves.toEqual(definition('child'));
  });
});
