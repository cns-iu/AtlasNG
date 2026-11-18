import { APP_ID, makeStateKey, TransferState } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IdGenerator, IdGeneratorConfig, provideIdGeneratorConfig } from './id-generator';

describe('IdGenerator', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  function setup(options?: { appId?: string; generatorConfig?: IdGeneratorConfig; randomValue?: number }): IdGenerator {
    if (options?.randomValue !== undefined) {
      vi.spyOn(Math, 'random').mockReturnValue(options.randomValue);
    }

    TestBed.configureTestingModule({
      providers: [
        { provide: APP_ID, useValue: options?.appId ?? 'ng' },
        provideIdGeneratorConfig(options?.generatorConfig ?? { infix: true }),
      ],
    });

    return TestBed.inject(IdGenerator);
  }

  it('generates ids with prefix, random infix, and an incrementing counter by default', () => {
    const generator = setup({ randomValue: 0.5 });
    const firstId = generator.getId('field');
    const secondId = generator.getId('field');

    expect(firstId).toMatch(/^field-[0-9a-f]+-0$/);
    expect(secondId).toMatch(/^field-[0-9a-f]+-1$/);
  });

  it('includes non-default app id in generated ids', () => {
    const generator = setup({ appId: 'atlas', randomValue: 0.5 });
    const id = generator.getId('field');

    expect(id).toMatch(/^field-atlas-[0-9a-f]+-0$/);
  });

  it('includes custom infix in generated ids', () => {
    const generator = setup({ appId: 'atlas', generatorConfig: { infix: 'custom' } });
    const id = generator.getId('field');

    expect(id).toBe('field-atlas-custom-0');
  });

  it('omits random infix when randomize is disabled', () => {
    const generator = setup({ appId: 'atlas', generatorConfig: { infix: false } });
    const id = generator.getId('field');

    expect(id).toBe('field-atlas-0');
  });

  it('reuses the random infix transferred from the server', () => {
    const key = makeStateKey<string>('atlasng-id-generator-infix');
    TestBed.configureTestingModule({
      providers: [{ provide: APP_ID, useValue: 'ng' }, provideIdGeneratorConfig({ infix: true })],
    });
    TestBed.inject(TransferState).set(key, 'abc123');
    const generator = TestBed.inject(IdGenerator);

    expect(generator.getId('field')).toBe('field-abc123-0');
  });

  it('stores the random infix for transfer to the browser', () => {
    const generator = setup({ randomValue: 0.5 });
    const [, infix] = generator.getId('field').split('-');

    expect(TestBed.inject(TransferState).get(makeStateKey<string>('atlasng-id-generator-infix'), null)).toBe(infix);
  });
});
