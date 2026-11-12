import { Component } from '@angular/core';
import {
  CONTENT_PARAGRAPH_DEFINITION,
  TABLE_DEFINITION,
  type ContentTableColumn,
} from '@atlasng/content-blocks/definitions/design-system';
import { createSchema, passthroughSchema } from '@atlasng/content-blocks/utils';
import { JsonValue } from 'type-fest';
import { ContentDefinition } from './definition';
import { ContentConfigOf, ContentDataOf } from './definition-output';

@Component({ template: '' })
class Fixture {}

function configValue<T>() {
  return createSchema<T, JsonValue | undefined>((value) => ({ value: value as T }));
}

interface WholeConfig {
  title: string;
  level?: number;
}

const WHOLE_CONFIG_DEFINITION = {
  name: 'whole-config',
  component: Fixture,
  config: createSchema<WholeConfig, JsonValue>((value) => ({ value: value as WholeConfig })),
} satisfies ContentDefinition;

const PER_KEY_CONFIG_DEFINITION = {
  name: 'per-key-config',
  component: Fixture,
  config: {
    title: configValue<string>(),
    level: configValue<number | undefined>(),
  },
} satisfies ContentDefinition;

const DATA_DEFINITION = {
  name: 'data',
  component: Fixture,
  data: {
    rows: passthroughSchema<string[]>(),
    columns: { schema: passthroughSchema<number[]>(), initialValue: () => [] },
    total: { schema: passthroughSchema<number | undefined>() },
  },
} satisfies ContentDefinition;

const EMPTY_DEFINITION = {
  name: 'empty',
  component: Fixture,
  content: { content: '*' },
} satisfies ContentDefinition;

describe('definition fixtures', () => {
  it('are definitions declared with satisfies ContentDefinition', () => {
    expectTypeOf(WHOLE_CONFIG_DEFINITION).toExtend<ContentDefinition>();
    expectTypeOf(PER_KEY_CONFIG_DEFINITION).toExtend<ContentDefinition>();
    expectTypeOf(DATA_DEFINITION).toExtend<ContentDefinition>();
    expectTypeOf(EMPTY_DEFINITION).toExtend<ContentDefinition>();
  });
});

describe('ContentConfigOf', () => {
  it('is the output of a whole-object config schema', () => {
    expectTypeOf<ContentConfigOf<typeof WHOLE_CONFIG_DEFINITION>>().toEqualTypeOf<WholeConfig>();
  });

  it('is the output of each per-key config schema, with keys accepting undefined optional', () => {
    expectTypeOf<ContentConfigOf<typeof PER_KEY_CONFIG_DEFINITION>>().toEqualTypeOf<{
      title: string;
      level?: number | undefined;
    }>();
  });

  it('is an empty record without config', () => {
    expectTypeOf<ContentConfigOf<typeof EMPTY_DEFINITION>>().toEqualTypeOf<Record<string, never>>();
    expectTypeOf<ContentConfigOf<typeof DATA_DEFINITION>>().toEqualTypeOf<Record<string, never>>();
  });

  it('types the config of design-system definitions', () => {
    expectTypeOf<ContentConfigOf<typeof TABLE_DEFINITION>>().toEqualTypeOf<{
      columns: ContentTableColumn[];
      appearance?: 'striped' | 'grid' | 'vertical-rules' | 'none' | undefined;
      rowHeight?: number | undefined;
    }>();
    expectTypeOf<ContentConfigOf<typeof CONTENT_PARAGRAPH_DEFINITION>>().toEqualTypeOf<Record<string, never>>();
  });
});

describe('ContentDataOf', () => {
  it('is the schema output of each data key, for bare schemas and entries with an initial value', () => {
    expectTypeOf<ContentDataOf<typeof DATA_DEFINITION>>().toEqualTypeOf<{
      rows: string[];
      columns: number[];
      total: number | undefined;
    }>();
  });

  it('is an empty record without data', () => {
    expectTypeOf<ContentDataOf<typeof EMPTY_DEFINITION>>().toEqualTypeOf<Record<string, never>>();
    expectTypeOf<ContentDataOf<typeof WHOLE_CONFIG_DEFINITION>>().toEqualTypeOf<Record<string, never>>();
  });

  it('types the data of design-system definitions', () => {
    expectTypeOf<ContentDataOf<typeof TABLE_DEFINITION>>().toEqualTypeOf<{ rows: Record<string, unknown>[] }>();
    expectTypeOf<ContentDataOf<typeof CONTENT_PARAGRAPH_DEFINITION>>().toEqualTypeOf<Record<string, never>>();
  });
});
