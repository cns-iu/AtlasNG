import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';

/**
 * Bootstraps the application on the server.
 *
 * @param context Bootstrap context provided by the server renderer.
 * @returns The application reference.
 */
const bootstrap = (context: BootstrapContext) => bootstrapApplication(App, config, context);

export default bootstrap;
