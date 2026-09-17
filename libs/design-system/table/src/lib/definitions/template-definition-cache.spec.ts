import {
  Component,
  createEnvironmentInjector,
  DestroyRef,
  EnvironmentInjector,
  inject,
  runInInjectionContext,
  type EmbeddedViewRef,
  type TemplateRef,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { HeaderCellContext } from '@swimlane/ngx-datatable';
import type { Table } from '../table';
import { HeaderCellTemplateContext } from './template-context';
import { HeaderCellDefinition, TABLE } from './template-definition';
import { TemplateDefinitionCache } from './template-definition-cache';

describe('TemplateDefinitionCache', () => {
  interface TestConfig {
    label: string;
    onDestroy: () => void;
  }

  @Component({
    imports: [HeaderCellTemplateContext],
    template: `<ng-template angHeaderCellTemplateContext>{{ config.label }}</ng-template>`,
  })
  class TestDefinition extends HeaderCellDefinition<TestConfig> {
    constructor() {
      super();
      inject(DestroyRef).onDestroy(this.config.onDestroy);
    }
  }

  function renderText(template: TemplateRef<HeaderCellContext>): string {
    const view: EmbeddedViewRef<HeaderCellContext> = template.createEmbeddedView({} as HeaderCellContext);
    view.detectChanges();
    const text = view.rootNodes.map((node: Node) => node.textContent ?? '').join('');
    view.destroy();
    return text.trim();
  }

  function createConfig(label: string): TestConfig {
    return { label, onDestroy: vi.fn() };
  }

  function setup() {
    TestBed.configureTestingModule({ providers: [{ provide: TABLE, useValue: {} as Table }] });

    const cache = TestBed.runInInjectionContext(() => new TemplateDefinitionCache<HeaderCellContext, TestConfig>());
    const getOrCreate = (key: object, labelOrConfig: string | TestConfig) => {
      const config = typeof labelOrConfig === 'string' ? createConfig(labelOrConfig) : labelOrConfig;
      return cache.getOrCreate(key, TestDefinition, config);
    };

    return { cache, getOrCreate };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: TABLE, useValue: {} as Table }] });
  });

  it('creates a definition and returns its configured template', () => {
    const { getOrCreate } = setup();
    const template = getOrCreate({}, 'First');

    expect(renderText(template)).toBe('First');
  });

  it('reuses a definition by key identity', () => {
    const { getOrCreate } = setup();
    const key = {};
    const config = createConfig('First');
    const first = getOrCreate(key, config);
    const second = getOrCreate(key, config);

    expect(second).toBe(first);
  });

  it('creates separate definitions for separate keys', () => {
    const { getOrCreate } = setup();
    const first = getOrCreate({}, 'First');
    const second = getOrCreate({}, 'Second');

    expect(second).not.toBe(first);
    expect(renderText(first)).toBe('First');
    expect(renderText(second)).toBe('Second');
  });

  it('retains marked entries and destroys unmarked entries during a sweep', () => {
    const { cache, getOrCreate } = setup();
    const retainedKey = {};
    const removedKey = {};
    const retainedConfig = createConfig('Retained');
    const removedConfig = createConfig('Removed');
    const retained = getOrCreate(retainedKey, retainedConfig);
    getOrCreate(removedKey, removedConfig);
    cache.sweep();

    expect(getOrCreate(retainedKey, retainedConfig)).toBe(retained);
    cache.sweep();
    expect(removedConfig.onDestroy).toHaveBeenCalledOnce();
    expect(retainedConfig.onDestroy).not.toHaveBeenCalled();

    cache.sweep();
    expect(retainedConfig.onDestroy).toHaveBeenCalledOnce();
  });

  it('clears and destroys every cached definition', () => {
    const { cache, getOrCreate } = setup();
    const first = createConfig('First');
    const second = createConfig('Second');
    getOrCreate({}, first);
    getOrCreate({}, second);

    cache.clear();

    expect(first.onDestroy).toHaveBeenCalledOnce();
    expect(second.onDestroy).toHaveBeenCalledOnce();
  });

  it('clears cached definitions when its injection context is destroyed', () => {
    const injector = createEnvironmentInjector([], TestBed.inject(EnvironmentInjector));
    const cache = runInInjectionContext(injector, () => new TemplateDefinitionCache<HeaderCellContext, TestConfig>());
    const config = createConfig('First');
    cache.getOrCreate({}, TestDefinition, config);

    injector.destroy();

    expect(config.onDestroy).toHaveBeenCalledOnce();
  });
});
