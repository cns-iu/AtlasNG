import { DefinitionRegistry } from '@atlasng/content-templates/definitions';
import { DataLoaderRegistry } from '@atlasng/content-templates/loaders';
import { DataParserRegistry } from '@atlasng/content-templates/parsers';
import { ConfigurationOf } from '@atlasng/core';
import { CONTENT_TEMPLATES_CONFIG } from '../config';

/** Registries and configuration the pipeline runs with. Created by the outlet for each render. */
export interface PipelineContext {
  /** Registry to load definitions from. */
  definitions: DefinitionRegistry;
  /** Registry to load data loaders from. */
  loaders: DataLoaderRegistry;
  /** Registry to load data parsers from. */
  parsers: DataParserRegistry;
  /** Configuration with defaults applied. */
  config: ConfigurationOf<typeof CONTENT_TEMPLATES_CONFIG>;
}
