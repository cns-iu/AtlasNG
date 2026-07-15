import { InjectionToken } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createConfigDefinition, injectConfig, provideConfig } from './config';

interface TestConfig {
  foo?: string;
  bar?: number;
}

const TEST_TOKEN = new InjectionToken<TestConfig>('TestConfig');

const DEFAULTS_FACTORY = (): Required<TestConfig> => ({ foo: 'default-foo', bar: 42 });

describe('injectConfig', () => {
  function setup(config?: TestConfig) {
    TestBed.configureTestingModule({
      providers: config ? [provideConfig(TEST_TOKEN, config)] : [],
    });
  }

  function getConfig() {
    return TestBed.runInInjectionContext(() => injectConfig(TEST_TOKEN, DEFAULTS_FACTORY));
  }

  it('returns defaults when no provider is registered', () => {
    setup();
    const result = getConfig();

    expect(result).toEqual({ foo: 'default-foo', bar: 42 });
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
});

describe('provideConfig', () => {
  it('registers the config value against the token', () => {
    const config: TestConfig = { foo: 'provided', bar: 7 };

    TestBed.configureTestingModule({
      providers: [provideConfig(TEST_TOKEN, config)],
    });

    expect(TestBed.inject(TEST_TOKEN)).toBe(config);
  });
});

describe('createConfigDefinition', () => {
  const CONFIG_DEF = createConfigDefinition<TestConfig>('MyConfig', DEFAULTS_FACTORY);

  function getConfig() {
    return TestBed.runInInjectionContext(() => CONFIG_DEF.inject());
  }

  it('creates a definition with a token named after the given name', () => {
    expect(CONFIG_DEF.token.toString()).toContain('MyConfig');
  });

  it('inject() returns defaults when nothing is provided', () => {
    const result = getConfig();

    expect(result).toEqual({ foo: 'default-foo', bar: 42 });
  });

  it('inject() merges provided values', () => {
    TestBed.configureTestingModule({
      providers: [CONFIG_DEF.provide({ bar: 100 })],
    });
    const result = getConfig();

    expect(result).toEqual({ foo: 'default-foo', bar: 100 });
  });

  it('provide() registers the config against the definition token', () => {
    const config: TestConfig = { foo: 'hello' };
    TestBed.configureTestingModule({
      providers: [CONFIG_DEF.provide(config)],
    });

    expect(TestBed.inject(CONFIG_DEF.token)).toBe(config);
  });
});
