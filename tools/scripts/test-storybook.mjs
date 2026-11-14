#!/usr/bin/env node

/**
 * Runs Storybook play functions (and render smoke tests) for a static Storybook build.
 *
 * Serves the static build on a free local port, runs `@storybook/test-runner` against it in
 * index.json mode, and exits with the test runner's exit code. A free port per run lets Nx run
 * several projects in parallel without port clashes.
 *
 * Usage: node tools/scripts/test-storybook.mjs <static-dir> [test-storybook options...]
 */

import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';

/** Content types for the file extensions emitted by a Storybook static build. */
const CONTENT_TYPES = {
  '.css': 'text/css',
  '.gif': 'image/gif',
  '.html': 'text/html',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.map': 'application/json',
  '.mjs': 'text/javascript',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

/**
 * Counts the story entries (not docs entries) in a Storybook `index.json`.
 *
 * @param {string} staticDir - Directory of the static Storybook build.
 * @returns {Promise<number>} Number of stories the test runner would visit.
 * @throws {Error} When the build has no readable `index.json`.
 */
async function countStories(staticDir) {
  const index = JSON.parse(await readFile(path.join(staticDir, 'index.json'), 'utf8'));
  return Object.values(index.entries ?? {}).filter((entry) => entry.type === 'story').length;
}

/**
 * Starts a static file server for a directory on a free port of the loopback interface.
 *
 * @param {string} root - Directory to serve.
 * @returns {Promise<{ server: import('node:http').Server, url: string }>} The server and its base URL.
 */
function serveStatic(root) {
  const server = createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    let filePath = path.join(root, path.normalize(pathname));

    if (filePath !== root && !filePath.startsWith(root + path.sep)) {
      response.writeHead(403).end();
      return;
    }

    try {
      if ((await stat(filePath)).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
      await stat(filePath);
    } catch {
      response.writeHead(404).end();
      return;
    }

    const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': contentType });
    createReadStream(filePath).pipe(response);
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = /** @type {import('node:net').AddressInfo} */ (server.address());
      resolve({ server, url: `http://127.0.0.1:${port}` });
    });
  });
}

/**
 * Runs the Storybook test runner and resolves with its exit code.
 *
 * @param {string} url - Base URL of the served Storybook.
 * @param {string[]} args - Extra arguments forwarded to `test-storybook`.
 * @returns {Promise<number>} Exit code of the test runner.
 */
function runTestRunner(url, args) {
  const require = createRequire(import.meta.url);
  const bin = require.resolve('@storybook/test-runner/dist/test-storybook.js');
  const child = spawn(process.execPath, [bin, '--url', url, '--index-json', ...args], { stdio: 'inherit' });

  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
}

/**
 * Entry point.
 *
 * @returns {Promise<number>} Process exit code.
 */
async function main() {
  const [staticDirArg, ...args] = process.argv.slice(2);
  if (!staticDirArg) {
    console.error('Usage: test-storybook.mjs <static-dir> [test-storybook options...]');
    return 1;
  }

  const staticDir = path.resolve(staticDirArg);
  const stories = await countStories(staticDir);
  if (stories === 0) {
    console.log(`No stories in ${staticDirArg}; skipping Storybook tests.`);
    return 0;
  }

  const { server, url } = await serveStatic(staticDir);
  try {
    return await runTestRunner(url, args);
  } finally {
    server.close();
  }
}

process.exitCode = await main();
