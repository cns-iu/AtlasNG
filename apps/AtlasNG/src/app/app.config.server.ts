import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

/** Providers that only apply when rendering on the server. */
const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(withRoutes(serverRoutes))],
};

/** Application configuration used for server rendering and prerendering. */
export const config = mergeApplicationConfig(appConfig, serverConfig);
