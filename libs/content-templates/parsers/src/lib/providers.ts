import { Provider } from '@angular/core';
import { Promisable } from 'type-fest';
import { DATA_PARSERS, DataParser, DataParserRegistry } from './data-parser-registry';

/**
 * Registers data parser factories and provides a {@link DataParserRegistry} for the environment injector. Each
 * factory runs once, on first use, in the environment injection context. Names not registered in this injector are
 * resolved through the registry of a parent environment injector, so routes can add parsers on top of the
 * application's.
 *
 * @param parsers Parser factories keyed by parser name.
 * @returns Providers to add to application or route providers.
 */
export function provideDataParsers(parsers: Record<string, () => Promisable<DataParser>>): Provider {
  return [
    {
      provide: DATA_PARSERS,
      useValue: parsers,
      multi: true,
    },
    DataParserRegistry,
  ];
}
