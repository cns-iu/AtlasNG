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
});
