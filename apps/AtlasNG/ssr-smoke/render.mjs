/* eslint-disable no-console -- The smoke check reports through the console and captures console output. */
// Renders every route with the server bundle and records the console output of each render.
// Usage: node render.mjs <server-dir> <output-dir> <route>...
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { captureConsole, formatArgs } from './capture.mjs';

const [serverDir, outputDir, ...routes] = process.argv.slice(2);

// `ɵgetOrCreateAngularServerApp` is what the Angular CLI uses to prerender routes. `allowStaticRouteRender` lets it
// render prerendered routes, and only GET and HEAD requests are served from the prerendered pages, so POST requests
// render every route again and its errors surface here.
const { ɵgetOrCreateAngularServerApp: getOrCreateAngularServerApp } = await import(
  pathToFileURL(resolve(serverDir, 'main.server.mjs')).href
);
const app = getOrCreateAngularServerApp({ allowStaticRouteRender: true });

/** @type {Record<string, { file?: string, failures: import('./capture.mjs').CapturedMessage[] }>} */
const results = {};
await mkdir(outputDir, { recursive: true });

for (const [index, route] of routes.entries()) {
  const capture = captureConsole();
  const result = { failures: [] };
  try {
    const response = await app.handle(new Request(new URL(route, 'http://localhost'), { method: 'POST' }));
    if (response?.status !== 200) {
      result.failures.push({
        level: 'error',
        message: `Expected status 200, got ${response?.status ?? 'no response'}.`,
      });
    } else {
      result.file = join(outputDir, `${index}.html`);
      await writeFile(result.file, await response.text());
    }
  } catch (error) {
    result.failures.push({ level: 'error', message: formatArgs([error]) });
  } finally {
    capture.restore();
  }

  result.failures.unshift(...capture.failures());
  results[route] = result;
}

console.log(JSON.stringify(results));
process.exit(0);
