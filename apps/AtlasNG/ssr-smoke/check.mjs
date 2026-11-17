/* eslint-disable no-console -- The smoke check reports through the console and captures console output. */
// SSR smoke check: renders every prerendered route with the server bundle and hydrates it in jsdom with the browser
// bundle. Fails when a render or hydration logs an error or warning or reports an Angular hydration error (NG05xx),
// or when the hydrated DOM differs from a client-only render of the same route (for example duplicated content).
// Usage: node check.mjs <dist-dir>
import { execFileSync } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(process.argv[2] ?? 'dist/apps/AtlasNG');

/**
 * Messages that are known issues, by route. Matching messages are reported but do not fail the check.
 * @type {Record<string, RegExp[]>}
 */
const KNOWN_ISSUES = {
  // TODO: Remove once content blocks support hydration. The content block renders its nodes again in the browser
  // instead of hydrating them, so the server-rendered content stays in the page next to the client-rendered copy.
  '/content-blocks': [/^Hydrated (text|elements) differs from a client-only render/],
};

/**
 * Runs a smoke check script in a separate Node process and parses the JSON it prints last.
 *
 * @param {string} script Script file name.
 * @param {string[]} args Script arguments.
 * @returns {any} The parsed result.
 */
function run(script, args) {
  const output = execFileSync(process.execPath, [join(scriptsDir, script), ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  return JSON.parse(output.trim().split('\n').at(-1));
}

/**
 * Describes where two strings start to differ.
 *
 * @param {string} label What is compared.
 * @param {string} hydrated Value after hydration.
 * @param {string} rendered Value after a client-only render.
 * @returns {string | undefined} A message with the differing excerpts, or undefined when the values are equal.
 */
function describeDifference(label, hydrated, rendered) {
  if (hydrated === rendered) {
    return undefined;
  }
  let index = 0;
  while (hydrated[index] === rendered[index]) {
    index++;
  }
  const excerpt = (value) => JSON.stringify(value.slice(Math.max(0, index - 40), index + 80));
  return `Hydrated ${label} differs from a client-only render at ${index}:\n hydrated: ${excerpt(hydrated)}\n rendered: ${excerpt(rendered)}`;
}

/**
 * Splits failures into known issues and real failures for a route.
 *
 * @param {string} route Route the failures belong to.
 * @param {{ level: string, message: string }[]} failures Captured failures.
 * @returns {{ known: typeof failures, unexpected: typeof failures }} The split failures.
 */
function classify(route, failures) {
  const patterns = KNOWN_ISSUES[route] ?? [];
  const known = failures.filter(({ message }) => patterns.some((pattern) => pattern.test(message)));
  return { known, unexpected: failures.filter((failure) => !known.includes(failure)) };
}

const { routes: prerendered } = JSON.parse(await readFile(join(distDir, 'prerendered-routes.json'), 'utf8'));
const routes = Object.keys(prerendered);
if (routes.length === 0) {
  throw new Error(`No prerendered routes found in ${distDir}.`);
}

const workDir = await mkdtemp(join(tmpdir(), 'atlasng-ssr-smoke-'));
let failed = false;
try {
  // The browser bundle is ES modules with a .js extension, so copy it next to a package.json that tells Node so.
  const browserDir = join(workDir, 'browser');
  await cp(join(distDir, 'browser'), browserDir, { recursive: true });
  await writeFile(join(browserDir, 'package.json'), '{ "type": "module" }');

  const rendered = run('render.mjs', [join(distDir, 'server'), join(workDir, 'html'), ...routes]);
  for (const route of routes) {
    const server = rendered[route];
    const client = server.file ? run('hydrate.mjs', [browserDir, server.file, route]) : undefined;
    const csr = client ? run('hydrate.mjs', [browserDir, join(browserDir, 'index.csr.html'), route]) : undefined;
    const differences = client
      ? [
          describeDifference('text', client.dom.text, csr.dom.text),
          describeDifference('elements', client.dom.elements, csr.dom.elements),
        ].filter(Boolean)
      : [];
    const failures = [
      ...server.failures.map((failure) => ({ ...failure, phase: 'server' })),
      ...(client?.failures ?? []).map((failure) => ({ ...failure, phase: 'hydration' })),
      ...(csr?.failures ?? []).map((failure) => ({ ...failure, phase: 'client render' })),
      ...differences.map((message) => ({ level: 'error', message, phase: 'dom' })),
    ];
    const { known, unexpected } = classify(route, failures);
    failed ||= unexpected.length > 0 || !server.file;

    console.log(`${unexpected.length ? '✘' : '✔'} ${route}${client?.stats ? ` (${client.stats})` : ''}`);
    for (const { phase, level, message } of unexpected) {
      console.log(`  [${phase} ${level}] ${message.replaceAll('\n', '\n    ')}`);
    }
    for (const { phase, level, message } of known) {
      console.log(`  known issue [${phase} ${level}] ${message.split('\n')[0]}`);
    }
  }
} finally {
  await rm(workDir, { recursive: true, force: true });
}

if (failed) {
  console.error('SSR smoke check failed.');
  process.exit(1);
}
