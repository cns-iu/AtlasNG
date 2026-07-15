import { EnvironmentProviders, makeEnvironmentProviders, Provider } from '@angular/core';
import { LinkHandler } from './handler';
import { RouterLinkHandler } from './router-handler';

export interface LinkHandlerFeature {
  kind: LinkHandlerFeatureKind;
  providers: (Provider | EnvironmentProviders)[];
}

export enum LinkHandlerFeatureKind {
  Custom,
  Router,
  Routerless,
}

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

export function withRouterlessHandler(): LinkHandlerFeature {
  return {
    kind: LinkHandlerFeatureKind.Routerless,
    // Routerless is the default handler, so we don't need to provide it explicitly.
    providers: [],
  };
}

export function provideLinkHandler(...features: LinkHandlerFeature[]): EnvironmentProviders {
  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    checkHandlerConfiguration(features);
  }

  return makeEnvironmentProviders(features.flatMap((feature) => feature.providers));
}

function checkHandlerConfiguration(features: LinkHandlerFeature[]): void {
  const kinds = [LinkHandlerFeatureKind.Custom, LinkHandlerFeatureKind.Router, LinkHandlerFeatureKind.Routerless];
  const handlerFeatures = features.filter((feature) => kinds.includes(feature.kind));

  if (handlerFeatures.length > 1) {
    throw new Error('Only one link handler can be provided.');
  }
}
