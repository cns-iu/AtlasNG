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
        commands: ['npx compodoc -p tsconfig.lib.json -d ../../dist/compodoc/{projectName} -n {projectName}'],
        cwd: '{projectRoot}',
      },
      metadata: { technologies: ['compodoc'], description: 'Builds the Compodoc API documentation' },
    });
    expect(targets['compodoc']).toEqual({
      executor: 'nx:run-commands',
      continuous: true,
      options: {
        commands: [
          'npx compodoc -p tsconfig.lib.json -d ../../dist/compodoc/{projectName} -n {projectName} --serve --watch',
        ],
        cwd: '{projectRoot}',
      },
      metadata: {
        technologies: ['compodoc'],
        description: 'Serves the Compodoc API documentation and rebuilds it on change',
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

  it('infers the Storybook Compodoc target for projects with a .storybook directory', async () => {
    write('libs/ds/ng-package.json');
    write('libs/ds/project.json');
    write('libs/ds/tsconfig.lib.json');
    write('libs/ds/.storybook/main.ts', '');

    const [[, result] = []] = await run(['libs/ds/ng-package.json']);
    const targets = result?.projects?.['libs/ds']?.targets ?? {};

    expect(Object.keys(targets)).toEqual(['build-compodoc', 'compodoc', 'build-storybook-compodoc']);
    expect(targets['build-storybook-compodoc']).toEqual({
      executor: 'nx:run-commands',
      cache: true,
      inputs: ['default', { externalDependencies: ['@compodoc/compodoc'] }],
      outputs: ['{projectRoot}/.storybook/compodoc/documentation.json'],
      options: {
        commands: [
          'npx compodoc -p tsconfig.lib.json -d .storybook/compodoc -n {projectName} -e json --disablePrivate --disableProtected --disableInternal',
        ],
        cwd: '{projectRoot}',
      },
      metadata: { technologies: ['compodoc'], description: 'Builds the Compodoc JSON that Storybook reads' },
    });
  });

  it('writes to the workspace dist directory from nested and root projects', async () => {
    write('libs/applications/kg/ng-package.json');
    write('libs/applications/kg/project.json');
    write('libs/applications/kg/tsconfig.lib.json');
    write('ng-package.json');
    write('project.json');
    write('tsconfig.lib.json');

    const results = await run(['libs/applications/kg/ng-package.json', 'ng-package.json']);
    const command = (projectRoot: string) =>
      (
        results.find(([file]) => dirname(file) === projectRoot)?.[1].projects?.[projectRoot]?.targets?.[
          'build-compodoc'
        ]?.options as { commands: string[] }
      ).commands[0];

    expect(command('libs/applications/kg')).toContain(' -d ../../../dist/compodoc/{projectName} ');
    expect(command('.')).toContain(' -d ./dist/compodoc/{projectName} ');
  });

  it('uses the configured Storybook Compodoc target name', async () => {
    write('libs/ds/ng-package.json');
    write('libs/ds/project.json');
    write('libs/ds/tsconfig.lib.json');
    write('libs/ds/.storybook/main.ts', '');

    const [[, result] = []] = await run(['libs/ds/ng-package.json'], { buildStorybookCompodocTargetName: 'sb-docs' });

    expect(Object.keys(result?.projects?.['libs/ds']?.targets ?? {})).toContain('sb-docs');
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
