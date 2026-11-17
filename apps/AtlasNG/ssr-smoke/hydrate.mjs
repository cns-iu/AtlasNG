/* eslint-disable no-console -- The smoke check reports through the console and captures console output. */
// Loads a page in jsdom, runs the browser bundle, and records the console output and the rendered DOM. With a
// server-rendered page the application hydrates it; with `index.csr.html` it renders on the client only.
// Usage: node hydrate.mjs <browser-dir> <html-file> <route>
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import { builtinEnvironments } from 'vitest/runtime';
import { captureConsole, formatArgs } from './capture.mjs';

const [browserDir, htmlFile, route] = process.argv.slice(2);

/** Longer than Angular's 10 second stability timeout, after which it warns with NG0506. */
const HYDRATION_TIMEOUT = 12_000;

/** Time the rendered DOM must stay unchanged before it is considered settled, which also catches late errors. */
const SETTLE_TIME = 500;

/**
 * Elements left out of the DOM comparison.
 *
 * - `.mdc-tab-indicator`: Angular Material tabs append their ink bar element in `ngOnInit`, which runs on the server
 *   and again during hydration, so hydrated tabs get a second ink bar. This is an upstream Material issue.
 */
const IGNORED_ELEMENTS = '.mdc-tab-indicator, .mdc-tab-indicator *';

/** Matches the hydration statistics Angular logs in development mode once the application is stable. */
const HYDRATION_STATS_PATTERN =
  /Angular hydrated (\d+) component\(s\) and (\d+) node\(s\), (\d+) component\(s\) were skipped/;

const html = await readFile(htmlFile, 'utf8');
/** Whether the page is the client-rendering shell rather than a server-rendered page. */
const clientOnly = /<body[^>]*\bngcm\b/.test(html);
await builtinEnvironments.jsdom.setup(globalThis, { jsdom: { html, url: new URL(route, 'http://localhost').href } });
installBrowserStubs();

const capture = captureConsole();
const uncaught = [];
window.addEventListener('error', (event) => uncaught.push(formatArgs([event.error ?? event.message])));
window.addEventListener('unhandledrejection', (event) => uncaught.push(formatArgs([event.reason])));
process.on('uncaughtException', (error) => uncaught.push(formatArgs([error])));
process.on('unhandledRejection', (reason) => uncaught.push(formatArgs([reason])));

for (const script of document.querySelectorAll('script[type="module"][src]')) {
  await import(pathToFileURL(resolve(browserDir, script.getAttribute('src'))).href);
}

const stats = clientOnly
  ? undefined
  : await waitFor(() => capture.messages.map(({ message }) => HYDRATION_STATS_PATTERN.exec(message)).find(Boolean));
const dom = await waitForStableDom();
capture.restore();

const failures = [...capture.failures(), ...uncaught.map((message) => ({ level: 'uncaught', message }))];
if (clientOnly) {
  // Only the DOM of a client render is compared; hydration problems are reported for the server-rendered page.
} else if (!stats) {
  failures.push({ level: 'error', message: 'The application did not report hydration statistics. Was it hydrated?' });
} else if (Number(stats[1]) === 0) {
  failures.push({ level: 'error', message: stats[0] });
}

console.log(JSON.stringify({ stats: stats?.[0], failures, dom }));
process.exit(0);

/**
 * Describes the rendered application as its element names and normalized text, ignoring attributes and comments.
 *
 * @returns {{ elements: string, text: string }} The element names in document order and the text content.
 */
function describeDom() {
  const root = document.querySelector('ang-root');
  return {
    elements: [...(root?.querySelectorAll('*') ?? [])]
      .filter((element) => !element.matches(IGNORED_ELEMENTS))
      .map((element) => element.localName)
      .join(' '),
    text: (root?.textContent ?? '').replace(/\s+/g, ' ').trim(),
  };
}

/**
 * Waits until the rendered DOM stops changing.
 *
 * @returns {Promise<{ elements: string, text: string }>} The settled DOM description.
 */
async function waitForStableDom() {
  let previous = '';
  let stableSince = Date.now();
  const deadline = Date.now() + HYDRATION_TIMEOUT;
  while (Date.now() < deadline) {
    await delay(50);
    const current = JSON.stringify(describeDom());
    if (current !== previous) {
      previous = current;
      stableSince = Date.now();
    } else if (Date.now() - stableSince >= SETTLE_TIME) {
      break;
    }
  }
  return JSON.parse(previous);
}

/**
 * Polls until a condition returns a truthy value or the hydration timeout elapses.
 *
 * @template T
 * @param {() => T | undefined} condition Condition to poll.
 * @returns {Promise<T | undefined>} The condition's value, or undefined on timeout.
 */
async function waitFor(condition) {
  const deadline = Date.now() + HYDRATION_TIMEOUT;
  while (Date.now() < deadline) {
    const value = condition();
    if (value) {
      return value;
    }
    await delay(50);
  }
  return undefined;
}

/**
 * Adds minimal stand-ins for browser APIs that jsdom does not implement.
 */
function installBrowserStubs() {
  /** Does nothing, so observed callbacks never run. */
  const noop = () => undefined;

  /** Observer stand-in that never reports changes. */
  class NoopObserver {
    observe = noop;
    unobserve = noop;
    disconnect = noop;
    takeRecords = () => [];
  }

  globalThis.ResizeObserver ??= window.ResizeObserver ??= NoopObserver;
  globalThis.IntersectionObserver ??= window.IntersectionObserver ??= NoopObserver;
  window.matchMedia ??= (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: noop,
    removeListener: noop,
    addEventListener: noop,
    removeEventListener: noop,
    dispatchEvent: () => false,
  });
  globalThis.matchMedia ??= window.matchMedia;
  window.HTMLElement.prototype.scrollIntoView ??= noop;
}
