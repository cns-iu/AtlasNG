import { APP_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ID_GENERATOR_OPTIONS, IdGenerator, type IdGeneratorOptions } from './id-generator';

describe('IdGenerator', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  function setup(options?: {
    appId?: string;
    generatorOptions?: IdGeneratorOptions;
    randomValue?: number;
  }): IdGenerator {
    if (options?.randomValue !== undefined) {
      vi.spyOn(Math, 'random').mockReturnValue(options.randomValue);
    }

    TestBed.configureTestingModule({
      providers: [
        { provide: APP_ID, useValue: options?.appId ?? 'ng' },
        { provide: ID_GENERATOR_OPTIONS, useValue: options?.generatorOptions ?? {} },
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

  it('omits random infix when randomize is disabled', () => {
    const generator = setup({ generatorOptions: { randomize: false }, appId: 'atlas' });

    const id = generator.getId('field');

    expect(id).toBe('field-atlas-0');
  });
});
