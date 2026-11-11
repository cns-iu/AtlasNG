import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createConfigurationToken, type } from './configuration-token';

interface TestConfig {
  foo?: string;
  bar?: number;
  baz?: boolean;
}

const DEFAULTS_FACTORY = () => ({ foo: 'default-foo', bar: 42 });

const TEST_CONFIG = createConfigurationToken({
  name: 'TestConfig',
  config: type<TestConfig>(),
  defaults: DEFAULTS_FACTORY,
});

const INHERITED_CONFIG = createConfigurationToken({
  name: 'InheritedConfig',
  config: type<TestConfig>(),
  defaults: DEFAULTS_FACTORY,
  inherit: true,
});

describe('type', () => {
  it('provides a compile-time type witness', () => {
    const witness = type<TestConfig>();

    expect(witness).toBeUndefined();
    expectTypeOf(witness).toEqualTypeOf<TestConfig>();
  });
});

describe('createConfigurationToken', () => {
  function setup(config?: TestConfig) {
    TestBed.configureTestingModule({
      providers: config ? [TEST_CONFIG.provide(config)] : [],
    });
  }

  function getConfig() {
    return TestBed.runInInjectionContext(() => TEST_CONFIG.inject());
  }

  it('creates an Angular token with the configured name', () => {
    expect(TEST_CONFIG.token.toString()).toContain('TestConfig');
  });

  it('returns defaults when no provider is registered', () => {
    setup();
    const result = getConfig();

    expect(result).toEqual({ foo: 'default-foo', bar: 42 });
    expectTypeOf(result).toEqualTypeOf<Readonly<{ foo: string; bar: number; baz?: boolean }>>();
  });

  it('merges provided values over defaults', () => {
    setup({ foo: 'custom-foo' });
    const result = getConfig();

    expect(result).toEqual({ foo: 'custom-foo', bar: 42 });
  });

  it('ignores undefined values in the provided config, keeping defaults', () => {
    setup({ foo: undefined, bar: 99 });
    const result = getConfig();

    expect(result).toEqual({ foo: 'default-foo', bar: 99 });
  });

  it('does not mutate the defaults object', () => {
    const snapshot = DEFAULTS_FACTORY();
    setup({ foo: 'mutate-check' });
    getConfig();

    expect(DEFAULTS_FACTORY()).toEqual(snapshot);
  });

  it('provides the config against its Angular token', () => {
    const config: TestConfig = { foo: 'provided', bar: 7 };

    TestBed.configureTestingModule({
      providers: [TEST_CONFIG.provide(config)],
    });

    expect(TestBed.inject(TEST_CONFIG.token)).toBe(config);
  });

  it('injects from a given injector outside an injection context', () => {
    setup({ foo: 'custom-foo' });

    expect(TEST_CONFIG.inject({ injector: TestBed.inject(Injector) })).toEqual({ foo: 'custom-foo', bar: 42 });
    expect(() => TEST_CONFIG.inject()).toThrow();
  });

  describe('with inherit', () => {
    function createChild(config: TestConfig, parent: Injector = TestBed.inject(Injector)) {
      return Injector.create({ providers: [INHERITED_CONFIG.provide(config)], parent });
    }

    it('provides the config when no parent provides one', () => {
      TestBed.configureTestingModule({ providers: [INHERITED_CONFIG.provide({ foo: 'root' })] });

      expect(TestBed.inject(INHERITED_CONFIG.token)).toEqual({ foo: 'root' });
      expect(TestBed.runInInjectionContext(() => INHERITED_CONFIG.inject())).toEqual({ foo: 'root', bar: 42 });
    });

    it('merges the config over the parent config', () => {
      TestBed.configureTestingModule({ providers: [INHERITED_CONFIG.provide({ foo: 'root', bar: 1 })] });
      const child = createChild({ bar: 2, baz: true });
      const grandchild = createChild({ foo: 'grandchild' }, child);

      expect(child.get(INHERITED_CONFIG.token)).toEqual({ foo: 'root', bar: 2, baz: true });
      expect(grandchild.get(INHERITED_CONFIG.token)).toEqual({ foo: 'grandchild', bar: 2, baz: true });
    });

    it('keeps parent values for undefined properties', () => {
      TestBed.configureTestingModule({ providers: [INHERITED_CONFIG.provide({ foo: 'root' })] });
      const child = createChild({ foo: undefined, bar: 2 });

      expect(child.get(INHERITED_CONFIG.token)).toEqual({ foo: 'root', bar: 2 });
    });
  });

  it('replaces the parent config without inherit', () => {
    TestBed.configureTestingModule({ providers: [TEST_CONFIG.provide({ foo: 'root', bar: 1 })] });
    const child = Injector.create({
      providers: [TEST_CONFIG.provide({ baz: true })],
      parent: TestBed.inject(Injector),
    });

    expect(child.get(TEST_CONFIG.token)).toEqual({ baz: true });
  });
});
