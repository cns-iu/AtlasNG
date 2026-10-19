import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
const configFiles = manifest.files;

/**
 * @param {string} file
 */
function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(projectRoot, file), 'utf8'));
}

/**
 * @param {string} file
 */
function parseConfig(file) {
  const fileName = path.join(projectRoot, file);
  const { config, error } = ts.readConfigFile(fileName, ts.sys.readFile);
  expect(error).toBeUndefined();

  const parsed = ts.parseJsonConfigFileContent(config, ts.sys, projectRoot, undefined, fileName);
  // TS18003 ("No inputs were found") is expected because the presets have no `include`.
  const errors = parsed.errors.filter(({ code }) => code !== 18003);

  return { options: parsed.options, raw: parsed.raw, errors };
}

describe('@atlasng/tsconfig', () => {
  it('publishes and exports the same configuration files', () => {
    expect(configFiles).toEqual(['base.json', 'angular.json', 'node.json']);

    for (const file of configFiles) {
      expect(manifest.exports[`./${file}`]).toBe(`./${file}`);
    }
  });

  it.each(configFiles)('%s is valid JSON', (file) => {
    expect(() => readJson(file)).not.toThrow();
  });

  it.each(configFiles)('%s only extends published files', (file) => {
    const { extends: base } = readJson(file);

    if (base !== undefined) {
      expect(base.startsWith('./')).toBe(true);
      expect(configFiles).toContain(base.slice(2));
    }
  });

  it.each(configFiles)('%s has no compiler option errors', (file) => {
    const { errors } = parseConfig(file);

    expect(errors.map(({ messageText }) => ts.flattenDiagnosticMessageText(messageText, '\n'))).toEqual([]);
  });

  it('base.json enables strict type checking', () => {
    const { options } = parseConfig('base.json');

    expect(options.strict).toBe(true);
    expect(options.noImplicitOverride).toBe(true);
    expect(options.isolatedModules).toBe(true);
  });

  it('angular.json targets bundlers and enables strict Angular checks', () => {
    const { options, raw } = parseConfig('angular.json');

    expect(options.strict).toBe(true);
    expect(options.target).toBe(ts.ScriptTarget.ES2023);
    expect(options.module).toBe(ts.ModuleKind.Preserve);
    expect(options.moduleResolution).toBe(ts.ModuleResolutionKind.Bundler);
    expect(options.experimentalDecorators).toBe(true);
    expect(raw.angularCompilerOptions).toMatchObject({
      strictInjectionParameters: true,
      strictInputAccessModifiers: true,
      strictStandalone: true,
      strictTemplates: true,
    });
  });

  it('node.json targets Node.js module resolution', () => {
    const { options } = parseConfig('node.json');

    expect(options.strict).toBe(true);
    expect(options.target).toBe(ts.ScriptTarget.ES2023);
    expect(options.module).toBe(ts.ModuleKind.NodeNext);
    expect(options.moduleResolution).toBe(ts.ModuleResolutionKind.NodeNext);
    expect(options.importHelpers).toBe(false);
  });
});
