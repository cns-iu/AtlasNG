import {
  Component,
  createEnvironmentInjector,
  EnvironmentInjector,
  type EmbeddedViewRef,
  type OnDestroy,
  runInInjectionContext,
  type TemplateRef,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { HeaderCellContext } from '@swimlane/ngx-datatable';
import type { Table } from '../table';
import { HeaderCellTemplateContext } from './template-context';
import { TemplateDefinitionCache } from './template-definition-cache';
import { HeaderCellDefinition, TABLE } from './template-definition';

interface TestConfig {
  label: string;
}

@Component({
  imports: [HeaderCellTemplateContext],
  template: `<ng-template angHeaderCellTemplateContext>{{ config.label }}</ng-template>`,
})
class FirstDefinition extends HeaderCellDefinition<TestConfig> implements OnDestroy {
  static destroyed = 0;

  ngOnDestroy(): void {
    FirstDefinition.destroyed += 1;
  }
}

@Component({
  imports: [HeaderCellTemplateContext],
  template: `<ng-template angHeaderCellTemplateContext>Alternate: {{ config.label }}</ng-template>`,
})
class AlternateDefinition extends HeaderCellDefinition<TestConfig> implements OnDestroy {
  static destroyed = 0;

  ngOnDestroy(): void {
    AlternateDefinition.destroyed += 1;
  }
}

function createCache(): TemplateDefinitionCache<HeaderCellContext, TestConfig> {
  return TestBed.runInInjectionContext(() => new TemplateDefinitionCache<HeaderCellContext, TestConfig>());
}

function renderText(template: TemplateRef<HeaderCellContext>): string {
  const view: EmbeddedViewRef<HeaderCellContext> = template.createEmbeddedView({} as HeaderCellContext);
  view.detectChanges();
  const text = view.rootNodes.map((node: Node) => node.textContent ?? '').join('');
  view.destroy();
  return text.trim();
}

describe('TemplateDefinitionCache', () => {
  beforeEach(() => {
    FirstDefinition.destroyed = 0;
    AlternateDefinition.destroyed = 0;
    TestBed.configureTestingModule({ providers: [{ provide: TABLE, useValue: {} as Table }] });
  });

  it('creates a definition and returns its configured template', () => {
    const cache = createCache();
    const template = cache.getOrCreate({}, FirstDefinition, { label: 'First' });

    expect(renderText(template)).toBe('First');
  });

  it('reuses a definition by key identity and retains its original type and configuration', () => {
    const cache = createCache();
    const key = {};
    const first = cache.getOrCreate(key, FirstDefinition, { label: 'First' });
    const second = cache.getOrCreate(key, AlternateDefinition, { label: 'Second' });

    expect(second).toBe(first);
    expect(renderText(second)).toBe('First');
  });

  it('creates separate definitions for separate keys', () => {
    const cache = createCache();
    const first = cache.getOrCreate({}, FirstDefinition, { label: 'First' });
    const second = cache.getOrCreate({}, FirstDefinition, { label: 'Second' });

    expect(second).not.toBe(first);
    expect(renderText(first)).toBe('First');
    expect(renderText(second)).toBe('Second');
  });

  it('retains marked entries and destroys unmarked entries during a sweep', () => {
    const cache = createCache();
    const retainedKey = {};
    const removedKey = {};
    const retained = cache.getOrCreate(retainedKey, FirstDefinition, { label: 'Retained' });
    cache.getOrCreate(removedKey, FirstDefinition, { label: 'Removed' });
    cache.sweep();

    expect(cache.getOrCreate(retainedKey, FirstDefinition, { label: 'Ignored' })).toBe(retained);
    cache.sweep();
    expect(FirstDefinition.destroyed).toBe(1);

    cache.sweep();
    expect(FirstDefinition.destroyed).toBe(2);
  });

  it('creates a replacement type and configuration after eviction', () => {
    const cache = createCache();
    const key = {};
    cache.getOrCreate(key, FirstDefinition, { label: 'First' });
    cache.sweep();
    cache.sweep();

    const replacement = cache.getOrCreate(key, AlternateDefinition, { label: 'Second' });

    expect(FirstDefinition.destroyed).toBe(1);
    expect(renderText(replacement)).toBe('Alternate: Second');
  });

  it('clears and destroys every cached definition', () => {
    const cache = createCache();
    cache.getOrCreate({}, FirstDefinition, { label: 'First' });
    cache.getOrCreate({}, AlternateDefinition, { label: 'Second' });

    cache.clear();

    expect(FirstDefinition.destroyed).toBe(1);
    expect(AlternateDefinition.destroyed).toBe(1);
  });

  it('clears cached definitions when its injection context is destroyed', () => {
    const injector = createEnvironmentInjector([], TestBed.inject(EnvironmentInjector));
    const cache = runInInjectionContext(injector, () => new TemplateDefinitionCache<HeaderCellContext, TestConfig>());
    cache.getOrCreate({}, FirstDefinition, { label: 'First' });

    injector.destroy();

    expect(FirstDefinition.destroyed).toBe(1);
  });
});
