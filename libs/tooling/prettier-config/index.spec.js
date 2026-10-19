// @ts-check
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as prettier from 'prettier';
import { describe, expect, it } from 'vitest';
import config from './index.js';

const configPath = fileURLToPath(new URL('./index.js', import.meta.url));
const projectRoot = path.dirname(configPath);

/**
 * @param {string} fileName
 */
function resolveFor(fileName) {
  return prettier.resolveConfig(path.join(projectRoot, 'src', fileName), { config: configPath, editorconfig: false });
}

describe('@atlasng/prettier-config', () => {
  it('sets the shared formatting options', () => {
    expect(config.printWidth).toBe(120);
    expect(config.singleQuote).toBe(true);
  });

  it('is exported by the package entry point', async () => {
    const manifest = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8'));
    const { default: exported } = await import(path.join(projectRoot, manifest.exports['.'].default));

    expect(exported).toBe(config);
  });

  it('formats Angular templates with the angular parser', async () => {
    await expect(resolveFor('app.component.html')).resolves.toMatchObject({ parser: 'angular', printWidth: 120 });
  });

  it('keeps the default parser for index.html', async () => {
    const options = await resolveFor('index.html');

    expect(options).toMatchObject({ printWidth: 120, singleQuote: true });
    expect(options).not.toHaveProperty('parser');
  });

  it('formats code with the shared options', async () => {
    const output = await prettier.format('const value = "text";', { ...config, parser: 'babel' });

    expect(output).toBe("const value = 'text';\n");
  });

  it('formats Angular control flow in templates', async () => {
    const options = await resolveFor('app.component.html');
    const output = await prettier.format('@if (show) {<span>{{ value }}</span>}', {
      ...options,
      filepath: 'app.component.html',
    });

    expect(output).toContain('@if (show) {');
  });
});
