import { Provider } from '@angular/core';
import { provideDefinitions } from '@atlasng/content-blocks/definitions';
import { DESIGN_SYSTEM_DEFINITIONS } from './definitions';

/**
 * Registers every design-system definition. Equivalent to `withDefinitions(DESIGN_SYSTEM_DEFINITIONS)`, for use
 * without `provideContentBlocks`. Components load lazily, on first use.
 *
 * @returns Providers to add to application or route providers.
 */
export function provideDesignSystemDefinitions(): Provider {
  return provideDefinitions(DESIGN_SYSTEM_DEFINITIONS);
}
