import { inject, Injectable, InjectionToken } from '@angular/core';
import { Promisable } from 'type-fest';
import { ContentDataParser } from '../types/content-data';
import { ContentRegistry } from './content-registry';

/** Creates a data parser. Runs once, on first use, in the environment injection context. */
export type ContentDataParserFactory = () => Promisable<ContentDataParser>;

/** Multi token collecting data parser factories keyed by parser name. */
export const CONTENT_DATA_PARSERS = new InjectionToken<Record<string, ContentDataParserFactory>[]>(
  'CONTENT_DATA_PARSERS',
);

/**
 * Resolves data parsers by name.
 *
 * Provided by `provideContentTemplates`. Names not registered in this injector are looked up in the registry of a
 * parent environment injector, if any.
 */
@Injectable()
export class ContentDataParserRegistry extends ContentRegistry<ContentDataParser> {
  /** Collects the factories registered in this injector. */
  constructor() {
    super(
      inject(ContentDataParserRegistry, { optional: true, skipSelf: true }),
      inject(CONTENT_DATA_PARSERS).flatMap((record) => Object.entries(record)),
    );
  }
}
