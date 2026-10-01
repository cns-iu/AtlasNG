import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ContentComponentDefinition } from '../types/content-component-definition';
import { ContentDefinitionRegistry } from './definition-registry';
import { ContentTemplatesFeature, provideContentTemplates, withDefinitions } from './providers';

class TestComponent {}

function definition(name: string): ContentComponentDefinition {
  return { name, component: TestComponent };
}

function setup(...features: ContentTemplatesFeature[]): ContentDefinitionRegistry {
  TestBed.configureTestingModule({ providers: [provideContentTemplates(...features)] });
  return TestBed.inject(ContentDefinitionRegistry);
}

function createChild(...features: ContentTemplatesFeature[]): ContentDefinitionRegistry {
  const injector = createEnvironmentInjector(
    [provideContentTemplates(...features)],
    TestBed.inject(EnvironmentInjector),
  );
  return injector.get(ContentDefinitionRegistry);
}

describe('ContentDefinitionRegistry', () => {
  it('rejects unknown definitions', async () => {
    const registry = setup();

    await expect(registry.get('missing')).rejects.toThrow("Unknown registry entry 'missing'.");
  });

  it('loads lazy definitions once', async () => {
    const load = vi.fn(async () => definition('lazy'));
    const registry = setup(withDefinitions({ lazy: load }));

    const first = await registry.get('lazy');
    const second = await registry.get('lazy');

    expect(first).toBe(second);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('treats a registered name differing from the definition name as an alias', async () => {
    const other = definition('other');
    const registry = setup(withDefinitions({ alias: () => other }));

    await expect(registry.get('alias')).resolves.toBe(other);
  });

  it('falls back to the parent registry', async () => {
    const parentDefinition = definition('parent');
    setup(withDefinitions([parentDefinition]));
    const child = createChild(withDefinitions([definition('child')]));

    await expect(child.get('parent')).resolves.toBe(parentDefinition);
    await expect(child.get('child')).resolves.toEqual(definition('child'));
  });
});
