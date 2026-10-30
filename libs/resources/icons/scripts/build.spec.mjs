// @ts-check
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  assignCodepoints,
  build,
  CATEGORIES,
  diffCodepoints,
  literalName,
  loadIcons,
  main,
  NAME_PATTERN,
  optimizeSvg,
  PUA_END,
  PUA_START,
  readCodepoints,
  renderCss,
  renderManifest,
  renderScss,
  validateCodepoints,
  validateIcons,
  validateSvgSource,
} from './build.mjs';

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const svgDir = path.join(projectDir, 'src/svg');
const codepointsFile = path.join(projectDir, 'src/codepoints.json');

/** @type {string[]} */
const tempDirs = [];

/**
 * @param {string} prefix
 */
async function tempDir(prefix) {
  const dir = await mkdtemp(path.join(os.tmpdir(), `ang-icons-${prefix}-`));
  tempDirs.push(dir);
  return dir;
}

/**
 * @param {string} dir
 * @returns {Promise<Record<string, string>>}
 */
async function hashTree(dir) {
  /** @type {Record<string, string>} */
  const hashes = {};
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  for (const entry of entries.filter((e) => e.isFile())) {
    const file = path.join(entry.parentPath, entry.name);
    hashes[path.relative(dir, file)] = createHash('sha256')
      .update(await readFile(file))
      .digest('hex');
  }
  return hashes;
}

afterAll(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('icon sources', () => {
  it('match the active codepoints both ways', async () => {
    const names = (await loadIcons(svgDir)).map((icon) => icon.name);
    const table = await readCodepoints(codepointsFile);

    expect(diffCodepoints(names, table)).toEqual({ missing: [], orphaned: [] });
    expect(Object.keys(table.codepoints).sort()).toEqual([...names].sort());
  });

  it('have valid, unique names in allowed categories', async () => {
    const icons = await loadIcons(svgDir);

    for (const icon of icons) {
      expect(icon.name).toMatch(NAME_PATTERN);
      expect(CATEGORIES).toContain(icon.category);
    }
    expect(new Set(icons.map((icon) => icon.name)).size).toBe(icons.length);
  });

  it('are plain filled SVGs with a viewBox', async () => {
    for (const { source } of await loadIcons(svgDir)) {
      expect(source).toMatch(/<svg\b[^>]*\sviewBox=/);
      expect(source).not.toMatch(/<script\b|<image\b|\sstroke(-[a-z]+)?=/i);
    }
  });

  it('have unique Private Use Area codepoints that do not reuse retired ones', async () => {
    const table = await readCodepoints(codepointsFile);
    const active = Object.values(table.codepoints).map((hex) => Number.parseInt(hex, 16));
    const retired = new Set(Object.values(table.retired));

    expect(validateCodepoints(table)).toEqual([]);
    expect(new Set(active).size).toBe(active.length);
    for (const codepoint of active) {
      expect(codepoint).toBeGreaterThanOrEqual(PUA_START);
      expect(codepoint).toBeLessThanOrEqual(PUA_END);
    }
    expect(Object.values(table.codepoints).filter((hex) => retired.has(hex))).toEqual([]);
  });
});

describe('validation', () => {
  it('reports invalid and duplicate names', () => {
    const source = '<svg viewBox="0 0 24 24"><path d="M0 0h1z"/></svg>';

    expect(
      validateIcons([
        { name: 'Bad_Name', category: 'misc', source },
        { name: 'heart', category: 'organs', source },
        { name: 'heart', category: 'misc', source },
      ]),
    ).toEqual([
      expect.stringContaining('misc/Bad_Name.svg: name must be kebab-case'),
      expect.stringContaining('misc/heart.svg: name "heart" is already used by organs/heart.svg'),
    ]);
  });

  it('reports unsafe or unsupported SVG content', () => {
    expect(validateSvgSource('<path/>')).toEqual(['missing <svg> root element']);
    expect(validateSvgSource('<svg><script/><image/><path stroke="#000" style="stroke-width: 2"/></svg>')).toEqual([
      'missing viewBox on the <svg> element',
      'must not contain <script>',
      'must not contain <image>',
      'must not use strokes; outline strokes before exporting',
    ]);
  });

  it('reports invalid codepoint tables', () => {
    expect(
      validateCodepoints({
        codepoints: { a: 'e000', b: 'e000', c: 'zz', d: '0041' },
        retired: { e: 'e000' },
      }),
    ).toEqual([
      'active "b": codepoint e000 is already used by active "a"',
      'active "c": codepoint "zz" is outside the Private Use Area (e000-f8ff)',
      'active "d": codepoint "0041" is outside the Private Use Area (e000-f8ff)',
      'retired "e": codepoint e000 is already used by active "a"',
    ]);
  });

  it('rejects unexpected folders and files', async () => {
    const dir = await tempDir('layout');
    await mkdir(path.join(dir, 'other'));
    await mkdir(path.join(dir, 'misc/nested'), { recursive: true });
    await writeFile(path.join(dir, 'misc/readme.txt'), '');

    await expect(loadIcons(dir)).rejects.toThrow(
      /Unexpected entry "misc\/nested"[\s\S]*Unexpected entry "misc\/readme.txt"[\s\S]*Unexpected entry "other"/,
    );
  });
});

describe('assignCodepoints', () => {
  it('assigns max + 1 to new icons in name order and keeps existing ones', () => {
    const table = assignCodepoints({ codepoints: { heart: 'e000', kidney: 'e001' }, retired: {} }, [
      'kidney',
      'lung',
      'heart',
      'brain',
    ]);

    expect(table).toEqual({ codepoints: { heart: 'e000', kidney: 'e001', brain: 'e002', lung: 'e003' }, retired: {} });
    expect(Object.keys(table.codepoints)).toEqual(['heart', 'kidney', 'brain', 'lung']);
  });

  it('retires removed icons and never reuses retired codepoints', () => {
    const table = assignCodepoints({ codepoints: { heart: 'e000', kidney: 'e001' }, retired: { old: 'e005' } }, [
      'heart',
      'lung',
    ]);

    expect(table).toEqual({ codepoints: { heart: 'e000', lung: 'e006' }, retired: { kidney: 'e001', old: 'e005' } });
  });

  it('starts at the beginning of the Private Use Area', () => {
    expect(assignCodepoints({ codepoints: {}, retired: {} }, ['a']).codepoints).toEqual({ a: 'e000' });
  });

  it('fails when the Private Use Area is exhausted', () => {
    expect(() => assignCodepoints({ codepoints: { a: 'f8ff' }, retired: {} }, ['a', 'b'])).toThrow(/No Private Use/);
  });
});

describe('renderers', () => {
  const icons = [{ name: 'left-kidney', category: 'organs', codepoint: 'e001', svg: '<svg/>' }];

  it('derives literal export names', () => {
    expect(literalName('left-kidney')).toBe('angIconLeftKidney');
  });

  it('renders icon classes and SCSS map entries', () => {
    expect(renderCss(icons)).toContain(".ang-icon--left-kidney::before {\n  content: '\\e001';\n}");
    expect(renderScss(icons)).toContain("'left-kidney': 'e001',");
  });

  it('renders an empty manifest type union as never', () => {
    expect(renderManifest([]).dts).toContain('export type IconName = never;');
  });

  it('replaces black fills with currentColor and keeps other colours', () => {
    const black = optimizeSvg('<svg viewBox="0 0 24 24"><path fill="black" d="M0 0h24v24H0z"/></svg>', 'a');
    const red = optimizeSvg('<svg viewBox="0 0 24 24" fill="#f00"><path d="M0 0h24v24H0z"/></svg>', 'b');

    expect(black).toContain('fill="currentColor"');
    expect(black).not.toMatch(/black|#000/);
    expect(red).toContain('fill="red"');
    expect(red).not.toContain('currentColor');
  });
});

describe('build', () => {
  /** @type {string} */
  let outA;
  /** @type {string} */
  let outB;

  beforeAll(async () => {
    outA = await tempDir('a');
    outB = await tempDir('b');
    await writeFile(path.join(outA, 'stale.txt'), 'stale');
    await build({ outDir: outA });
    await build({ outDir: outB });
  });

  it('is deterministic', async () => {
    expect(await hashTree(outA)).toEqual(await hashTree(outB));
  });

  it('cleans the output directory', async () => {
    await expect(stat(path.join(outA, 'stale.txt'))).rejects.toThrow();
  });

  it('writes the package files', async () => {
    const icons = await loadIcons(svgDir);
    const expected = [
      'package.json',
      'README.md',
      'LICENSE',
      'index.css',
      'font-face.css',
      'index.d.css.ts',
      'files/ang-icons.woff2',
      'scss/_index.scss',
      'sprite.svg',
      'literals/index.js',
      'literals/index.d.ts',
      'manifest.json',
      'manifest.js',
      'manifest.d.ts',
      ...icons.flatMap(({ name, category }) => [
        `svg/${category}/${name}.svg`,
        `literals/${name}.js`,
        `literals/${name}.d.ts`,
      ]),
    ];

    expect(Object.keys(await hashTree(outA)).sort()).toEqual(expected.sort());
    expect((await stat(path.join(outA, 'files/ang-icons.woff2'))).size).toBeGreaterThan(0);
  });

  it('writes typed manifests and importable literals', async () => {
    const icons = await loadIcons(svgDir);
    const dts = await readFile(path.join(outA, 'manifest.d.ts'), 'utf8');
    const union = icons.map(({ name }) => `'${name}'`).join(' | ');
    const literals = await import(path.join(outA, 'literals/index.js'));
    const manifest = await import(path.join(outA, 'manifest.js'));

    expect(dts).toContain(`export type IconName = ${union};`);
    expect(Object.keys(literals)).toEqual(icons.map(({ name }) => literalName(name)));
    expect(manifest.icons.map((/** @type {{ name: string }} */ icon) => icon.name)).toEqual(
      icons.map(({ name }) => name),
    );
  });

  it('writes a sprite with one symbol per icon', async () => {
    const sprite = await readFile(path.join(outA, 'sprite.svg'), 'utf8');
    const icons = await loadIcons(svgDir);

    expect([...sprite.matchAll(/<symbol id="([^"]+)" [^>]*viewBox=/g)].map((match) => match[1])).toEqual(
      icons.map(({ name }) => name),
    );
  });
});

describe('main', () => {
  /**
   * @param {string} name
   */
  async function copyProject(name) {
    const dir = await tempDir(name);
    for (const file of ['src', 'package.json', 'README.md', 'LICENSE']) {
      await cp(path.join(projectDir, file), path.join(dir, file), { recursive: true });
    }
    return dir;
  }

  it('fails the build when codepoints are out of date', async () => {
    const dir = await copyProject('stale');
    await cp(path.join(svgDir, 'organs/heart.svg'), path.join(dir, 'src/svg/organs/new-icon.svg'));
    await rm(path.join(dir, 'src/svg/organs/kidney.svg'));

    await expect(main(['--out', path.join(dir, 'out')], dir)).rejects.toThrow(
      /SVG without codepoint: new-icon[\s\S]*codepoint without SVG: kidney[\s\S]*icons:codepoints/,
    );
  });

  it('writes codepoints and then builds', async () => {
    const dir = await copyProject('write');
    await cp(path.join(svgDir, 'organs/heart.svg'), path.join(dir, 'src/svg/organs/new-icon.svg'));
    await rm(path.join(dir, 'src/svg/organs/kidney.svg'));
    const before = await readCodepoints(path.join(dir, 'src/codepoints.json'));

    await expect(main(['--write-codepoints'], dir)).resolves.toMatch(/^Wrote \d+ codepoints/);

    const after = await readCodepoints(path.join(dir, 'src/codepoints.json'));
    expect(after.retired.kidney).toBe(before.codepoints.kidney);
    expect(after.codepoints['new-icon']).toBeDefined();
    await expect(main(['--out', path.join(dir, 'out')], dir)).resolves.toMatch(/^Built \d+ icons/);
  });

  it('refuses to write codepoints from an invalid table', async () => {
    const dir = await copyProject('invalid');
    await writeFile(path.join(dir, 'src/codepoints.json'), JSON.stringify({ codepoints: { heart: '41' } }));

    await expect(main(['--write-codepoints'], dir)).rejects.toThrow(/Invalid src\/codepoints.json/);
  });

  it('treats a missing codepoints file as empty', async () => {
    const dir = await copyProject('missing');
    await rm(path.join(dir, 'src/codepoints.json'));

    await expect(readCodepoints(path.join(dir, 'src/codepoints.json'))).resolves.toEqual({
      codepoints: {},
      retired: {},
    });
    await expect(readCodepoints(path.join(dir, 'src'))).rejects.toThrow();
  });
});
