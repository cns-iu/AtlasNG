import { EnvironmentInjector, inject, Injectable, runInInjectionContext } from '@angular/core';
import { ContentDataParser } from '../types/content-data';
import { mergeEntries, unknownNameError } from './registry-utils';
import { CONTENT_DATA_PARSERS } from './tokens';

/**
 * Resolves data parsers by name.
 *
 * Provided by `provideContentTemplates`. Names not registered in this injector are looked up in the registry of a
 * parent environment injector, if any. Each data parser is created once, on first use, in the environment injection context.
 */
@Injectable()
export class ContentDataParserRegistry {
  /** Registry of a parent environment injector, used for names not registered here. */
  readonly #parent = inject(ContentDataParserRegistry, { optional: true, skipSelf: true });
  /** Injector in which factories run. */
  readonly #injector = inject(EnvironmentInjector);
  /** Registered factories. */
  readonly #factories = mergeEntries('data parser', inject(CONTENT_DATA_PARSERS));
  /** Created instances. */
  readonly #instances = new Map<string, ContentDataParser>();

  /**
   * Resolves a data parser, creating it on first use.
   *
   * @param name Parser name, as used in `ContentDataSource.parser`.
   * @returns The data parser instance.
   * @throws When no data parser is registered under `name`.
   */
  get(name: string): ContentDataParser {
    const factory = this.#factories.get(name);
    if (factory === undefined) {
      if (this.#parent) {
        return this.#parent.get(name);
      }
      throw unknownNameError('data parser', name);
    }

    let instance = this.#instances.get(name);
    if (instance === undefined) {
      instance = runInInjectionContext(this.#injector, factory);
      this.#instances.set(name, instance);
    }

    return instance;
  }
}
