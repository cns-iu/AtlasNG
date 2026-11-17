import { RenderMode } from '@angular/ssr';
import { appConfig } from './app.config';
import { config } from './app.config.server';
import { serverRoutes } from './app.routes.server';

describe('server config', () => {
  it('extends the browser config', () => {
    expect(config.providers).toEqual(expect.arrayContaining(appConfig.providers));
    expect(config.providers.length).toBeGreaterThan(appConfig.providers.length);
  });

  it('prerenders every route', () => {
    expect(serverRoutes).toEqual([{ path: '**', renderMode: RenderMode.Prerender }]);
  });
});
