import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ContentComponentDefinition } from '../types/content-component-definition';
import { ContentDefinitionRegistry } from './definition-registry';
import { ContentTemplatesFeature, provideContentTemplates, withDefinitions, withLazyDefinitions } from './providers';

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

    await expect(registry.get('missing')).rejects.toThrow("Unknown component definition 'missing'.");
  });

  it('loads lazy definitions once', async () => {
    const load = vi.fn(async () => definition('lazy'));
    const registry = setup(withLazyDefinitions({ lazy: load }));

    const first = await registry.get('lazy');
    const second = await registry.get('lazy');

    expect(first).toBe(second);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('retries a lazy definition after a failed load', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(definition('lazy'));
    const registry = setup(withLazyDefinitions({ lazy: load }));

    await expect(registry.get('lazy')).rejects.toThrow('offline');
    await expect(registry.get('lazy')).resolves.toEqual(definition('lazy'));
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('rejects a lazy definition whose name differs from its key', async () => {
    const registry = setup(withLazyDefinitions({ lazy: () => definition('other') }));

    await expect(registry.get('lazy')).rejects.toThrow("Component definition registered as 'lazy' is named 'other'.");
  });

  it('falls back to the parent registry', async () => {
    const parentDefinition = definition('parent');
    setup(withDefinitions([parentDefinition]));
    const child = createChild(withDefinitions([definition('child')]));

    await expect(child.get('parent')).resolves.toBe(parentDefinition);
    await expect(child.get('child')).resolves.toEqual(definition('child'));
  });

  it('throws in dev mode for duplicate names', () => {
    expect(() => setup(withDefinitions([definition('a')]), withDefinitions([definition('a')]))).toThrow(
      "Duplicate component definition 'a'.",
    );
  });
});
