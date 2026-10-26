import { DefinitionRegistry } from '@atlasng/content-blocks/definitions';
import { DataLoaderRegistry } from '@atlasng/content-blocks/loaders';
import { DataParserRegistry } from '@atlasng/content-blocks/parsers';
import { ConfigurationOf } from '@atlasng/core';
import { CONTENT_BLOCKS_CONFIG } from '../config';

/** Registries and configuration the pipeline runs with. Created by the outlet for each render. */
export interface PipelineContext {
  /** Registry to load definitions from. */
  definitions: DefinitionRegistry;
  /** Registry to load data loaders from. */
  loaders: DataLoaderRegistry;
  /** Registry to load data parsers from. */
  parsers: DataParserRegistry;
  /** Configuration with defaults applied. */
  config: ConfigurationOf<typeof CONTENT_BLOCKS_CONFIG>;
}
