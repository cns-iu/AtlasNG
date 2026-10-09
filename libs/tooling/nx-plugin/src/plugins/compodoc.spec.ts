import type { CreateNodesContext } from '@nx/devkit';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createNodes, createNodesV2 } from './compodoc.ts';

describe('compodoc plugin', () => {
  let root: string;
  let context: CreateNodesContext;

  const write = (path: string, content = '{}') => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  };

  const run = (files: string[], options?: Parameters<(typeof createNodesV2)[1]>[1]) =>
    createNodesV2[1](files, options, context);

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'compodoc-plugin-'));
    context = { workspaceRoot: root, nxJsonConfiguration: {} } as CreateNodesContext;
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('matches ng-package.json files', () => {
    expect(createNodesV2[0]).toBe('**/ng-package.json');
    expect(createNodes).toBe(createNodesV2);
  });

  it('infers the build and serve targets with the default names', async () => {
    write('libs/cdk/ng-package.json');
    write('libs/cdk/project.json');
    write('libs/cdk/tsconfig.lib.json');

    const results = await run(['libs/cdk/ng-package.json']);

    expect(results).toHaveLength(1);
    const [file, result] = results[0] ?? [];
    expect(file).toBe('libs/cdk/ng-package.json');
    const targets = result?.projects?.['libs/cdk']?.targets ?? {};
    expect(Object.keys(targets)).toEqual(['build-compodoc', 'compodoc']);
    expect(targets['build-compodoc']).toEqual({
      executor: 'nx:run-commands',
      cache: true,
      inputs: ['default', { externalDependencies: ['@compodoc/compodoc'] }],
      outputs: ['{workspaceRoot}/dist/compodoc/{projectName}'],
      options: {
        commands: [
          // eslint-disable-next-line no-template-curly-in-string -- shell parameter expansion
          'npx compodoc -p tsconfig.lib.json -d ${PWD%/{projectRoot}}/dist/compodoc/{projectName} -n {projectName}',
        ],
        cwd: '{projectRoot}',
      },
    });
    expect(targets['compodoc']).toEqual({
      executor: 'nx:run-commands',
      continuous: true,
      options: {
        commands: [
          // eslint-disable-next-line no-template-curly-in-string -- shell parameter expansion
          'npx compodoc -p tsconfig.lib.json -d ${PWD%/{projectRoot}}/dist/compodoc/{projectName} -n {projectName} --serve --watch',
        ],
        cwd: '{projectRoot}',
      },
    });
  });

  it('uses the configured target names', async () => {
    write('libs/a/ng-package.json');
    write('libs/a/package.json');
    write('libs/a/tsconfig.lib.json');

    const [[, result] = []] = await run(['libs/a/ng-package.json'], {
      buildCompodocTargetName: 'docs',
      compodocTargetName: 'docs-serve',
    });

    expect(Object.keys(result?.projects?.['libs/a']?.targets ?? {})).toEqual(['docs', 'docs-serve']);
  });

  it('skips secondary entry points and projects without tsconfig.lib.json', async () => {
    write('libs/a/project.json');
    write('libs/a/tsconfig.lib.json');
    write('libs/a/sub/ng-package.json');
    write('libs/b/ng-package.json');
    write('libs/b/project.json');

    const results = await run(['libs/a/sub/ng-package.json', 'libs/b/ng-package.json']);

    expect(results.map(([, result]) => result)).toEqual([{}, {}]);
  });
});
