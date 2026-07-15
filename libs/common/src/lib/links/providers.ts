import { EnvironmentProviders, makeEnvironmentProviders, Provider } from '@angular/core';
import { LinkHandler } from './handler';
import { RouterLinkHandler } from './router-handler';

/**
 * Provider bundle returned by link-handler feature helpers.
 */
export interface LinkHandlerFeature {
  /** Feature discriminator. */
  kind: LinkHandlerFeatureKind;

  /** Providers contributed by the feature. */
  providers: (Provider | EnvironmentProviders)[];
}

/**
 * Link handler feature variants supported by {@link provideLinkHandler}.
 */
export enum LinkHandlerFeatureKind {
  /** Feature that installs a caller-supplied {@link LinkHandler}. */
  Custom,

  /** Feature that installs the Angular Router-aware handler. */
  Router,

  /** Feature that keeps the default routerless handler. */
  Routerless,
}

/**
 * Configures link navigation with a custom handler factory.
 *
 * @param handlerFactory Factory that creates the custom link handler.
 * @returns Link handler feature consumed by {@link provideLinkHandler}.
 */
export function withCustomHandler(handlerFactory: () => LinkHandler): LinkHandlerFeature {
  return {
    kind: LinkHandlerFeatureKind.Custom,
    providers: [
      {
        provide: LinkHandler,
        useFactory: handlerFactory,
      },
    ],
  };
}

/**
 * Configures link navigation to use Angular Router for route commands.
 *
 * @returns Link handler feature consumed by {@link provideLinkHandler}.
 */
export function withRouterHandler(): LinkHandlerFeature {
  return {
    kind: LinkHandlerFeatureKind.Router,
    providers: [
      {
        provide: LinkHandler,
        useExisting: RouterLinkHandler,
      },
    ],
  };
}

/**
 * Explicitly selects the default routerless link handler.
 *
 * @returns Link handler feature consumed by {@link provideLinkHandler}.
 */
export function withRouterlessHandler(): LinkHandlerFeature {
  return {
    kind: LinkHandlerFeatureKind.Routerless,
    // Routerless is the default handler, so we don't need to provide it explicitly.
    providers: [],
  };
}

/**
 * Creates Angular environment providers for the selected link handler features.
 *
 * @param features Link handler features to install.
 * @returns Environment providers that register the selected handler.
 * @throws When more than one handler feature is configured in development mode.
 */
export function provideLinkHandler(...features: LinkHandlerFeature[]): EnvironmentProviders {
  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    checkHandlerConfiguration(features);
  }

  return makeEnvironmentProviders(features.flatMap((feature) => feature.providers));
}

/**
 * Validates that only one link handler strategy is configured.
 *
 * @param features Features passed to {@link provideLinkHandler}.
 * @throws When multiple handler strategy features are present.
 */
function checkHandlerConfiguration(features: LinkHandlerFeature[]): void {
  const kinds = [LinkHandlerFeatureKind.Custom, LinkHandlerFeatureKind.Router, LinkHandlerFeatureKind.Routerless];
  const handlerFeatures = features.filter((feature) => kinds.includes(feature.kind));

  if (handlerFeatures.length > 1) {
    throw new Error('Only one link handler can be provided.');
  }
}
