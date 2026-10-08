// @ts-check
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { ESLint, Linter } from 'eslint';
import { describe, expect, it } from 'vitest';
import angularEntry from '@atlasng/eslint-plugin/angular';
import typescriptEntry from '@atlasng/eslint-plugin/typescript';
import plugin from './index.js';

const packageJson = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

const LAZY_KEYS = ['flat/javascript', 'flat/typescript', 'flat/angular', 'flat/angular-template', 'flat/storybook'];

/** @type {Record<string, string>} */
const SAMPLE_FILES = {
  'flat/base': 'package.json',
  'flat/javascript': 'src/index.js',
  'flat/typescript': 'src/index.ts',
  'flat/angular': 'src/component.ts',
  'flat/angular-template': 'src/component.html',
  'flat/storybook': 'src/button.stories.ts',
};

const COMPONENT = `import { Component, Input } from '@angular/core';

@Component({ selector: 'foo-bar', template: '<div></div>' })
export class FooBar {
  @Input() value = '';
}
`;

/** @type {import('eslint').Linter.Config[]} */
const angularConfig = [
  ...plugin.configs['flat/base'],
  ...plugin.configs['flat/typescript'],
  ...plugin.configs['flat/angular'],
  ...plugin.configs['flat/angular-template'],
];

/**
 * @param {string} code
 * @param {import('eslint').Linter.Config[]} config
 * @param {string} filename
 */
function ruleIds(code, config, filename) {
  return new Linter().verify(code, config, filename).map((message) => message.ruleId);
}

describe('@atlasng/eslint-plugin', () => {
  it('exposes the package name and version as plugin metadata', () => {
    expect(plugin.meta).toEqual({ name: '@atlasng/eslint-plugin', version: packageJson.version });
    expect(plugin.rules).toEqual({});
  });

  it('exposes the flat configurations under Nx-style keys', () => {
    expect(Object.keys(plugin.configs)).toEqual(['flat/base', ...LAZY_KEYS]);
  });

  it.each(['flat/base', ...LAZY_KEYS])('resolves %s to a non-empty flat configuration', async (key) => {
    const config = plugin.configs[/** @type {keyof typeof plugin.configs} */ (key)];
    expect(Array.isArray(config)).toBe(true);
    expect(config.length).toBeGreaterThan(0);

    const eslint = new ESLint({ overrideConfigFile: true, baseConfig: config });
    const resolved = await eslint.calculateConfigForFile(SAMPLE_FILES[key]);
    expect(Object.keys(resolved?.rules ?? {}).length).toBeGreaterThan(0);
  });

  describe('lazy loading', () => {
    it('defines flat/base as a plain value', () => {
      const descriptor = Object.getOwnPropertyDescriptor(plugin.configs, 'flat/base');
      expect(descriptor?.get).toBeUndefined();
      expect(descriptor?.value).toBe(plugin.configs['flat/base']);
    });

    it.each(LAZY_KEYS)('defines %s as a getter', (key) => {
      const descriptor = Object.getOwnPropertyDescriptor(plugin.configs, key);
      expect(descriptor?.get).toBeTypeOf('function');
      expect(descriptor?.value).toBeUndefined();
    });

    it('returns the same configuration on every access', () => {
      expect(plugin.configs['flat/angular']).toBe(plugin.configs['flat/angular']);
    });

    it('does not load angular-eslint or eslint-plugin-storybook until their configurations are read', () => {
      const script = `
        import { createRequire } from 'node:module';
        const require = createRequire(import.meta.url);
        const loaded = (name) => Object.keys(require.cache).some((file) => file.includes('/node_modules/' + name + '/'));
        const { default: plugin } = await import('./index.js');
        const before = { angular: loaded('angular-eslint'), storybook: loaded('eslint-plugin-storybook') };
        plugin.configs['flat/angular'];
        const after = { angular: loaded('angular-eslint') };
        console.log(JSON.stringify({ before, after }));
      `;
      const output = execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
        cwd: import.meta.dirname,
        encoding: 'utf8',
      });

      expect(JSON.parse(output)).toEqual({ before: { angular: false, storybook: false }, after: { angular: true } });
    });
  });

  describe('rules', () => {
    it('reports curly in JavaScript files', () => {
      const config = [...plugin.configs['flat/base'], ...plugin.configs['flat/javascript']];

      expect(ruleIds('if (globalThis.x) globalThis.y = 1;\n', config, 'file.js')).toContain('curly');
    });

    it('keeps curly enabled for JavaScript files when the TypeScript configuration comes last', () => {
      const config = [
        ...plugin.configs['flat/base'],
        ...plugin.configs['flat/javascript'],
        ...plugin.configs['flat/typescript'],
      ];

      expect(ruleIds('if (globalThis.x) globalThis.y = 1;\n', config, 'file.js')).toContain('curly');
    });

    it('reports non-null assertions in TypeScript files as errors', () => {
      const config = [...plugin.configs['flat/base'], ...plugin.configs['flat/typescript']];
      const messages = new Linter().verify('export const value = [1].at(0)!;\n', config, 'file.ts');

      expect(messages).toContainEqual(
        expect.objectContaining({ ruleId: '@typescript-eslint/no-non-null-assertion', severity: 2 }),
      );
    });

    it('reports decorator inputs in Angular components', () => {
      expect(ruleIds(COMPONENT, angularConfig, 'foo-bar.ts')).toContain('@angular-eslint/prefer-signals');
    });

    it('checks selector style but not a prefix', () => {
      const valid = COMPONENT.replace('@Input() value', 'readonly value');
      const camelCase = valid.replace("'foo-bar'", "'fooBar'");

      expect(ruleIds(valid, angularConfig, 'foo-bar.ts')).not.toContain('@angular-eslint/component-selector');
      expect(ruleIds(camelCase, angularConfig, 'foo-bar.ts')).toContain('@angular-eslint/component-selector');
    });

    it('reports template rules in HTML templates', () => {
      expect(ruleIds('<ang-icon></ang-icon>\n', angularConfig, 'template.html')).toContain(
        '@angular-eslint/template/prefer-self-closing-tags',
      );
    });

    it('reports Storybook rules in stories', () => {
      const config = [
        ...plugin.configs['flat/base'],
        ...plugin.configs['flat/typescript'],
        ...plugin.configs['flat/storybook'],
      ];

      expect(ruleIds('export const Primary = {};\n', config, 'button.stories.ts')).toContain(
        'storybook/default-exports',
      );
    });

    it('unignores the .storybook directory', () => {
      expect(plugin.configs['flat/storybook']).toContainEqual(expect.objectContaining({ ignores: ['!.storybook'] }));
    });

    it('ignores build output directories', () => {
      expect(plugin.configs['flat/base']).toContainEqual(
        expect.objectContaining({ ignores: ['**/dist', '**/out-tsc'] }),
      );
    });
  });

  describe('subpath exports', () => {
    it('exports the Angular configurations from @atlasng/eslint-plugin/angular', () => {
      expect(angularEntry.rules).toEqual({});
      expect(angularEntry.configs.angular).toStrictEqual(plugin.configs['flat/angular']);
      expect(angularEntry.configs['angular-template']).toStrictEqual(plugin.configs['flat/angular-template']);
    });

    it('exports the JavaScript and TypeScript configurations from @atlasng/eslint-plugin/typescript', () => {
      expect(typescriptEntry.rules).toEqual({});
      expect(typescriptEntry.configs.javascript).toStrictEqual(plugin.configs['flat/javascript']);
      expect(typescriptEntry.configs.typescript).toStrictEqual(plugin.configs['flat/typescript']);
    });
  });
});
