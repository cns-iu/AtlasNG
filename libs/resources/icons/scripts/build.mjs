// @ts-check
/**
 * Builds the `@atlasng/icons` package from the SVG sources in `src/svg`.
 *
 * Usage:
 *
 * ```bash
 * node libs/resources/icons/scripts/build.mjs [--out <dir>]   # check codepoints, then build
 * node libs/resources/icons/scripts/build.mjs --write-codepoints  # assign codepoints, then exit
 * ```
 *
 * The output (default `dist/libs/resources/icons`, relative to the workspace root) contains an icon font with
 * ligatures, CSS and SCSS entry points, optimized SVG files, an SVG sprite, ESM string literals, and a manifest.
 * The build is deterministic: inputs are sorted, font timestamps are fixed, and the output directory is recreated.
 */
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import svg2ttf from 'svg2ttf';
import { SVGIcons2SVGFontStream } from 'svgicons2svgfont';
import { optimize } from 'svgo';
import wawoff2 from 'wawoff2';

/**
 * An icon source file discovered in `src/svg/<category>/<name>.svg`.
 *
 * @typedef {object} IconSource
 * @property {string} name Kebab-case icon name, unique across categories.
 * @property {string} category Category folder the icon lives in.
 * @property {string} file Absolute path of the source SVG.
 * @property {string} source Raw SVG markup.
 */

/**
 * An icon with its assigned codepoint and optimized SVG markup, ready to be rendered into the package outputs.
 *
 * @typedef {object} Icon
 * @property {string} name Kebab-case icon name.
 * @property {string} category Category folder the icon lives in.
 * @property {string} codepoint Lowercase hexadecimal Private Use Area codepoint, e.g. `e000`.
 * @property {string} svg Optimized SVG markup.
 */

/**
 * Contents of `src/codepoints.json`. Active entries map icon names to codepoints; retired entries keep the
 * codepoints of removed icons so they are never handed out again.
 *
 * @typedef {object} CodepointTable
 * @property {Record<string, string>} codepoints Active icon name to hexadecimal codepoint.
 * @property {Record<string, string>} retired Removed icon name to its former hexadecimal codepoint.
 */

/** Category folders allowed under `src/svg`, in display order. */
export const CATEGORIES = Object.freeze(['organs', 'products', 'misc']);

/** Pattern every icon name (the SVG file name without extension) must match. */
export const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** First codepoint of the Basic Multilingual Plane Private Use Area, where codepoint assignment starts. */
export const PUA_START = 0xe000;

/** Last codepoint of the Basic Multilingual Plane Private Use Area. */
export const PUA_END = 0xf8ff;

/** CSS font family name of the icon font. */
export const FONT_FAMILY = 'AtlasNG Icons';

/** Base CSS class; icon classes are `ang-icon--<name>`. */
export const CLASS_PREFIX = 'ang-icon';

/** Path of the woff2 font relative to the package root. */
export const FONT_FILE = 'files/ang-icons.woff2';

/**
 * Font units per em. Icons are drawn on a 24x24 grid, so 960 (= 24 * 40) maps grid coordinates to whole font units.
 */
const FONT_HEIGHT = 960;

/** Absolute path of the `libs/resources/icons` project. */
const PROJECT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Absolute path of the workspace root. */
const WORKSPACE_ROOT = path.resolve(PROJECT_DIR, '../../..');

/** Default output directory, relative to the workspace root. */
const DEFAULT_OUT_DIR = 'dist/libs/resources/icons';

/** Fill values treated as "black" and replaced by `currentColor` so the icons inherit the text colour. */
const BLACK_FILLS = new Set(['#000', '#000000', '#000f', '#000000ff', 'black']);

/**
 * Converts a kebab-case name to PascalCase.
 *
 * @param {string} name Kebab-case name, e.g. `left-kidney`.
 * @returns {string} PascalCase name, e.g. `LeftKidney`.
 */
export function toPascalCase(name) {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Returns the export name of an icon's SVG string literal.
 *
 * @param {string} name Kebab-case icon name.
 * @returns {string} Export name, e.g. `angIconHeart`.
 */
export function literalName(name) {
  return `angIcon${toPascalCase(name)}`;
}

/**
 * Compares two strings by UTF-16 code units so sorting does not depend on the host locale.
 *
 * @param {string} a First string.
 * @param {string} b Second string.
 * @returns {number} Negative, zero, or positive like `Array.prototype.sort` expects.
 */
function compareStrings(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Reads all icon sources from `<svgDir>/<category>/<name>.svg`.
 *
 * @param {string} svgDir Directory containing the category folders.
 * @returns {Promise<IconSource[]>} Icons sorted by name.
 * @throws {Error} When folders or files do not follow the layout, names are invalid or duplicated, or an SVG fails
 *   {@link validateSvgSource}. All problems are reported in one error.
 */
export async function loadIcons(svgDir) {
  /** @type {string[]} */
  const errors = [];
  /** @type {IconSource[]} */
  const icons = [];
  const entries = (await readdir(svgDir, { withFileTypes: true })).sort((a, b) => compareStrings(a.name, b.name));

  for (const entry of entries) {
    if (!entry.isDirectory() || !CATEGORIES.includes(entry.name)) {
      errors.push(`Unexpected entry "${entry.name}" in ${svgDir}; allowed category folders: ${CATEGORIES.join(', ')}`);
      continue;
    }

    const categoryDir = path.join(svgDir, entry.name);
    const files = (await readdir(categoryDir, { withFileTypes: true })).sort((a, b) => compareStrings(a.name, b.name));

    for (const file of files) {
      if (!file.isFile() || !file.name.endsWith('.svg')) {
        errors.push(`Unexpected entry "${entry.name}/${file.name}"; only .svg files are allowed`);
        continue;
      }

      const filePath = path.join(categoryDir, file.name);
      const source = await readFile(filePath, 'utf8');
      icons.push({ name: file.name.slice(0, -'.svg'.length), category: entry.name, file: filePath, source });
    }
  }

  errors.push(...validateIcons(icons));
  if (errors.length > 0) {
    throw new Error(`Invalid icon sources:\n  - ${errors.join('\n  - ')}`);
  }

  return icons.sort((a, b) => compareStrings(a.name, b.name));
}

/**
 * Validates icon names, name uniqueness across categories, and SVG content.
 *
 * @param {Pick<IconSource, 'name' | 'category' | 'source'>[]} icons Icons to validate.
 * @returns {string[]} Human-readable problems; empty when all icons are valid.
 */
export function validateIcons(icons) {
  /** @type {string[]} */
  const errors = [];
  /** @type {Map<string, string>} */
  const seen = new Map();

  for (const { name, category, source } of icons) {
    const id = `${category}/${name}.svg`;
    if (!NAME_PATTERN.test(name)) {
      errors.push(`${id}: name must be kebab-case (${NAME_PATTERN})`);
    }

    const previous = seen.get(name);
    if (previous !== undefined) {
      errors.push(`${id}: name "${name}" is already used by ${previous}/${name}.svg`);
    } else {
      seen.set(name, category);
    }

    errors.push(...validateSvgSource(source).map((problem) => `${id}: ${problem}`));
  }

  return errors;
}

/**
 * Checks that an SVG is a plain, filled icon: it must have a `viewBox` and must not contain scripts, embedded images,
 * or strokes (strokes are not representable in the icon font, so they must be outlined before export).
 *
 * @param {string} source Raw SVG markup.
 * @returns {string[]} Problems found; empty when the SVG is acceptable.
 */
export function validateSvgSource(source) {
  /** @type {string[]} */
  const problems = [];
  const root = /<svg\b[^>]*>/i.exec(source);

  if (!root) {
    problems.push('missing <svg> root element');
  } else if (!/\sviewBox\s*=/.test(root[0])) {
    problems.push('missing viewBox on the <svg> element');
  }
  if (/<script\b/i.test(source)) {
    problems.push('must not contain <script>');
  }
  if (/<image\b/i.test(source)) {
    problems.push('must not contain <image>');
  }
  if (/\sstroke(-[a-z]+)?\s*=|stroke(-[a-z]+)?\s*:/i.test(source)) {
    problems.push('must not use strokes; outline strokes before exporting');
  }

  return problems;
}

/**
 * Parses a hexadecimal codepoint string.
 *
 * @param {string} hex Hexadecimal codepoint, e.g. `e000`.
 * @returns {number} The numeric codepoint, or `NaN` when `hex` is not a hexadecimal string.
 */
function parseCodepoint(hex) {
  return /^[0-9a-f]+$/i.test(hex) ? Number.parseInt(hex, 16) : Number.NaN;
}

/**
 * Formats a numeric codepoint as the lowercase, four-digit hexadecimal string used in `codepoints.json`.
 *
 * @param {number} codepoint Numeric codepoint.
 * @returns {string} Hexadecimal codepoint, e.g. `e000`.
 */
function formatCodepoint(codepoint) {
  return codepoint.toString(16).padStart(4, '0');
}

/**
 * Validates a codepoint table: every codepoint must be a valid Private Use Area codepoint, active codepoints must be
 * unique, and no active codepoint may reuse a retired one.
 *
 * @param {CodepointTable} table Codepoint table to validate.
 * @returns {string[]} Problems found; empty when the table is valid.
 */
export function validateCodepoints(table) {
  /** @type {string[]} */
  const errors = [];
  /** @type {Map<number, string>} */
  const owners = new Map();

  for (const [kind, entries] of /** @type {const} */ ([
    ['active', table.codepoints],
    ['retired', table.retired],
  ])) {
    for (const [name, hex] of Object.entries(entries)) {
      const codepoint = parseCodepoint(hex);
      if (!(codepoint >= PUA_START && codepoint <= PUA_END)) {
        errors.push(`${kind} "${name}": codepoint "${hex}" is outside the Private Use Area (e000-f8ff)`);
        continue;
      }

      const owner = owners.get(codepoint);
      if (owner !== undefined) {
        errors.push(`${kind} "${name}": codepoint ${hex} is already used by ${owner}`);
      } else {
        owners.set(codepoint, `${kind} "${name}"`);
      }
    }
  }

  return errors;
}

/**
 * Compares the icon names with the active codepoints.
 *
 * @param {string[]} names Names of the icon SVGs.
 * @param {CodepointTable} table Codepoint table.
 * @returns {{ missing: string[], orphaned: string[] }} `missing` lists SVGs without a codepoint, `orphaned` lists
 *   codepoints without an SVG. Both are sorted.
 */
export function diffCodepoints(names, table) {
  const nameSet = new Set(names);
  return {
    missing: names.filter((name) => !Object.hasOwn(table.codepoints, name)).sort(compareStrings),
    orphaned: Object.keys(table.codepoints)
      .filter((name) => !nameSet.has(name))
      .sort(compareStrings),
  };
}

/**
 * Brings a codepoint table in line with the current icons without ever reusing a codepoint: existing assignments
 * are kept, codepoints of removed icons move to `retired`, and new icons get the next codepoint after the highest
 * one ever assigned (active or retired), in name order.
 *
 * @param {CodepointTable} table Current codepoint table; it is not modified.
 * @param {string[]} names Names of the current icon SVGs.
 * @returns {CodepointTable} Updated table with entries sorted by codepoint.
 * @throws {Error} When the Private Use Area is exhausted.
 */
export function assignCodepoints(table, names) {
  const { missing, orphaned } = diffCodepoints(names, table);
  /** @type {Record<string, string>} */
  const codepoints = { ...table.codepoints };
  /** @type {Record<string, string>} */
  const retired = { ...table.retired };

  for (const name of orphaned) {
    retired[name] = codepoints[name];
    delete codepoints[name];
  }

  const used = [...Object.values(table.codepoints), ...Object.values(table.retired)].map(parseCodepoint);
  let next = Math.max(PUA_START - 1, ...used) + 1;
  for (const name of missing) {
    if (next > PUA_END) {
      throw new Error('No Private Use Area codepoints left (e000-f8ff)');
    }
    codepoints[name] = formatCodepoint(next++);
  }

  return { codepoints: sortByCodepoint(codepoints), retired: sortByCodepoint(retired) };
}

/**
 * Sorts a name-to-codepoint record by codepoint, then name, so newly assigned entries are appended.
 *
 * @param {Record<string, string>} entries Name to hexadecimal codepoint.
 * @returns {Record<string, string>} A new record with sorted insertion order.
 */
function sortByCodepoint(entries) {
  return Object.fromEntries(
    Object.entries(entries).sort(
      ([nameA, a], [nameB, b]) => parseCodepoint(a) - parseCodepoint(b) || compareStrings(nameA, nameB),
    ),
  );
}

/**
 * Reads `codepoints.json`, defaulting missing sections to empty objects.
 *
 * @param {string} file Path of the codepoint table.
 * @returns {Promise<CodepointTable>} The parsed table, or an empty table when the file does not exist.
 */
export async function readCodepoints(file) {
  try {
    const data = JSON.parse(await readFile(file, 'utf8'));
    return { codepoints: data.codepoints ?? {}, retired: data.retired ?? {} };
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code === 'ENOENT') {
      return { codepoints: {}, retired: {} };
    }
    throw error;
  }
}

/**
 * Serializes a codepoint table the way it is committed.
 *
 * @param {CodepointTable} table Codepoint table.
 * @returns {string} Pretty-printed JSON with a trailing newline.
 */
export function renderCodepoints(table) {
  return `${JSON.stringify(table, null, 2)}\n`;
}

/**
 * Optimizes an icon SVG with a fixed svgo configuration. Besides the default preset it keeps `viewBox`, removes
 * `width`/`height`, `class`, `style` and `data-*` attributes and `<style>` elements, prefixes remaining ids with the
 * icon name so they cannot collide inside the sprite, and replaces black fills with `currentColor`. Because the SVG
 * default fill is black, the root element also gets `fill="currentColor"` unless it sets a fill, so single-colour
 * icons follow the surrounding text colour while explicit non-black colours are preserved.
 *
 * @param {string} source Raw SVG markup.
 * @param {string} name Icon name, used to prefix ids.
 * @returns {string} Optimized single-line SVG markup.
 */
export function optimizeSvg(source, name) {
  return optimize(source, {
    multipass: true,
    plugins: [
      'preset-default',
      'convertStyleToAttrs',
      'removeDimensions',
      'removeStyleElement',
      { name: 'removeAttrs', params: { attrs: ['class', 'style', 'data-.*'] } },
      { name: 'prefixIds', params: { prefix: name, delim: '-', prefixClassNames: false } },
      {
        name: 'currentColorFill',
        fn: () => ({
          element: {
            enter: (node, parent) => {
              const fill = node.attributes.fill;
              if (fill !== undefined && BLACK_FILLS.has(fill.toLowerCase())) {
                node.attributes.fill = 'currentColor';
              }
              if (node.name === 'svg' && parent.type === 'root' && node.attributes.fill === undefined) {
                node.attributes.fill = 'currentColor';
              }
            },
          },
        }),
      },
    ],
  }).data;
}

/**
 * Combines icon sources with their codepoints and optimizes the SVG markup.
 *
 * @param {IconSource[]} sources Icon sources sorted by name.
 * @param {CodepointTable} table Codepoint table that covers every source.
 * @returns {Icon[]} Icons sorted by name.
 */
export function prepareIcons(sources, table) {
  return sources.map(({ name, category, source }) => ({
    name,
    category,
    codepoint: table.codepoints[name],
    svg: optimizeSvg(source, name),
  }));
}

/**
 * Splits an optimized SVG into its root attributes and inner markup.
 *
 * @param {string} svg Optimized SVG markup.
 * @returns {{ attributes: [string, string][], content: string }} Root attributes in source order and inner markup.
 * @throws {Error} When the markup is not a single `<svg>` element.
 */
function splitSvg(svg) {
  const match = /^<svg\b([^>]*?)\/?>([\s\S]*?)(?:<\/svg>)?$/.exec(svg.trim());
  if (!match) {
    throw new Error(`Not an <svg> element: ${svg.slice(0, 40)}`);
  }
  const attributes = [...match[1].matchAll(/([\w:.-]+)="([^"]*)"/g)].map(
    ([, key, value]) => /** @type {[string, string]} */ ([key, value]),
  );
  return { attributes, content: match[2] };
}

/**
 * Renders the `@font-face` rule for the icon font.
 *
 * @param {string} [url] URL of the woff2 file.
 * @returns {string} CSS containing only the `@font-face` rule.
 */
export function renderFontFaceCss(url = `./${FONT_FILE}`) {
  return [
    '@font-face {',
    `  font-family: '${FONT_FAMILY}';`,
    '  font-style: normal;',
    '  font-weight: 400;',
    '  font-display: block;',
    `  src: url(${url}) format('woff2');`,
    '}',
    '',
  ].join('\n');
}

/**
 * Declarations shared by the `.ang-icon` CSS class and the `ang-icon` SCSS mixin. They mirror the Material Symbols
 * base class: ligatures enabled, no text transforms, one-line glyph box.
 */
const BASE_DECLARATIONS = Object.freeze([
  `font-family: '${FONT_FAMILY}';`,
  'font-weight: normal;',
  'font-style: normal;',
  'font-size: 24px;',
  'line-height: 1;',
  'letter-spacing: normal;',
  'text-transform: none;',
  'display: inline-block;',
  'white-space: nowrap;',
  'word-wrap: normal;',
  'direction: ltr;',
  "-webkit-font-feature-settings: 'liga';",
  "font-feature-settings: 'liga';",
  '-webkit-font-smoothing: antialiased;',
  '-moz-osx-font-smoothing: grayscale;',
  'text-rendering: optimizeLegibility;',
]);

/**
 * Renders `index.css`: the `@font-face` rule, the `.ang-icon` base class, and one `.ang-icon--<name>::before` rule
 * per icon for use without ligatures.
 *
 * @param {Pick<Icon, 'name' | 'codepoint'>[]} icons Icons sorted by name.
 * @returns {string} CSS source.
 */
export function renderCss(icons) {
  const base = [`.${CLASS_PREFIX} {`, ...BASE_DECLARATIONS.map((line) => `  ${line}`), '}', ''];
  const classes = icons.flatMap(({ name, codepoint }) => [
    `.${CLASS_PREFIX}--${name}::before {`,
    `  content: '\\${codepoint}';`,
    '}',
    '',
  ]);
  return [renderFontFaceCss(), ...base, ...classes].join('\n');
}

/**
 * Renders `scss/_index.scss` with the `$ang-icons` map, a `font-face` mixin, and an `ang-icon` mixin.
 *
 * @param {Pick<Icon, 'name' | 'codepoint'>[]} icons Icons sorted by name.
 * @returns {string} SCSS source.
 */
export function renderScss(icons) {
  const entries = icons.map(({ name, codepoint }) => `  '${name}': '${codepoint}',`);
  return [
    '// Generated by @atlasng/icons. Do not edit.',
    "@use 'sass:map';",
    "@use 'sass:string';",
    '',
    `/// Font family of the AtlasNG icon font.`,
    `$font-family: '${FONT_FAMILY}';`,
    '',
    '/// Icon names mapped to their hexadecimal Private Use Area codepoints.',
    '$ang-icons: (',
    ...entries,
    ');',
    '',
    '/// Emits the @font-face rule for the icon font.',
    "/// @param {String} $path-prefix - URL prefix of the package root, e.g. '/assets/ang-icons'.",
    "@mixin font-face($path-prefix: '..') {",
    '  @font-face {',
    '    font-family: $font-family;',
    '    font-style: normal;',
    '    font-weight: 400;',
    '    font-display: block;',
    `    src: url('#{$path-prefix}/${FONT_FILE}') format('woff2');`,
    '  }',
    '}',
    '',
    '/// Emits the icon base styles and, when a name is given, a ::before rule rendering that icon.',
    '/// @param {String} $name - Icon name from $ang-icons, or null for base styles only.',
    '@mixin ang-icon($name: null) {',
    ...BASE_DECLARATIONS.map((line) => `  ${line.replace(`'${FONT_FAMILY}'`, '$font-family')}`),
    '',
    '  @if $name {',
    '    @if not map.has-key($ang-icons, $name) {',
    '      @error "Unknown AtlasNG icon \'#{$name}\'.";',
    '    }',
    '',
    '    &::before {',
    `      content: string.unquote('"\\\\#{map.get($ang-icons, $name)}"');`,
    '    }',
    '  }',
    '}',
    '',
  ].join('\n');
}

/**
 * Renders the SVG sprite with one `<symbol id="<name>">` per icon, compatible with
 * `MatIconRegistry.addSvgIconSetInNamespace`.
 *
 * @param {Pick<Icon, 'name' | 'svg'>[]} icons Icons sorted by name.
 * @returns {string} Sprite SVG markup.
 */
export function renderSprite(icons) {
  const symbols = icons.map(({ name, svg }) => {
    const { attributes, content } = splitSvg(svg);
    const attrs = attributes
      .filter(([key]) => key !== 'xmlns' && !key.startsWith('xmlns:'))
      .map(([key, value]) => ` ${key}="${value}"`)
      .join('');
    return `  <symbol id="${name}"${attrs}>${content}</symbol>`;
  });
  return ['<svg xmlns="http://www.w3.org/2000/svg">', ...symbols, '</svg>', ''].join('\n');
}

/**
 * Renders the ESM module exporting one icon's SVG string.
 *
 * @param {Pick<Icon, 'name' | 'category' | 'svg'>} icon Icon to render.
 * @returns {{ js: string, dts: string }} Module source and its type declaration.
 */
export function renderLiteral({ name, category, svg }) {
  const doc = `/** SVG markup of the "${name}" icon (${category}). */`;
  return {
    js: `${doc}\nexport const ${literalName(name)} = '${svg.replace(/[\\']/g, '\\$&').replace(/\n/g, '\\n')}';\n`,
    dts: `${doc}\nexport declare const ${literalName(name)}: string;\n`,
  };
}

/**
 * Renders `literals/index.js` and its declaration, re-exporting every per-icon module.
 *
 * @param {Pick<Icon, 'name'>[]} icons Icons sorted by name.
 * @returns {{ js: string, dts: string }} Module source and its type declaration.
 */
export function renderLiteralsIndex(icons) {
  const lines = icons.map(({ name }) => `export { ${literalName(name)} } from './${name}.js';`).join('\n');
  return { js: `${lines}\n`, dts: `${lines}\n` };
}

/**
 * Builds the manifest entries describing every icon.
 *
 * @param {Pick<Icon, 'name' | 'category' | 'codepoint'>[]} icons Icons sorted by name.
 * @returns {{ name: string, category: string, codepoint: string, path: string }[]} Manifest entries.
 */
export function manifestEntries(icons) {
  return icons.map(({ name, category, codepoint }) => ({
    name,
    category,
    codepoint,
    path: `svg/${category}/${name}.svg`,
  }));
}

/**
 * Renders `manifest.json`, `manifest.js`, and `manifest.d.ts`.
 *
 * @param {Pick<Icon, 'name' | 'category' | 'codepoint'>[]} icons Icons sorted by name.
 * @returns {{ json: string, js: string, dts: string }} The three manifest files.
 */
export function renderManifest(icons) {
  const entries = manifestEntries(icons);
  const categories = CATEGORIES.filter((category) => icons.some((icon) => icon.category === category));
  const union = (/** @type {string[]} */ values) =>
    values.length > 0 ? values.map((value) => `'${value}'`).join(' | ') : 'never';

  const js = [
    '/** Every icon in the package, sorted by name. */',
    `export const icons = ${JSON.stringify(entries, null, 2)};`,
    '',
    '/** Icon categories that contain at least one icon. */',
    `export const categories = ${JSON.stringify(categories)};`,
    '',
  ].join('\n');

  const dts = [
    '/** Name of an icon in the package. */',
    `export type IconName = ${union(icons.map((icon) => icon.name))};`,
    '',
    '/** Category of an icon. */',
    `export type IconCategory = ${union(categories)};`,
    '',
    '/** Describes one icon. */',
    'export interface IconManifestEntry {',
    '  /** Icon name, also the font ligature, sprite symbol id, and CSS class suffix. */',
    '  readonly name: IconName;',
    '  /** Category folder of the icon. */',
    '  readonly category: IconCategory;',
    '  /** Hexadecimal Private Use Area codepoint of the font glyph. */',
    '  readonly codepoint: string;',
    '  /** Path of the optimized SVG relative to the package root. */',
    '  readonly path: string;',
    '}',
    '',
    '/** Every icon in the package, sorted by name. */',
    'export declare const icons: readonly IconManifestEntry[];',
    '',
    '/** Icon categories that contain at least one icon. */',
    'export declare const categories: readonly IconCategory[];',
    '',
  ].join('\n');

  return { json: `${JSON.stringify(entries, null, 2)}\n`, js, dts };
}

/**
 * Generates the woff2 icon font. Each glyph is mapped to its codepoint and to a ligature of its name, so both
 * `"\e000"` and the text `heart` render the heart icon when the `liga` feature is enabled.
 *
 * @param {Pick<Icon, 'name' | 'codepoint' | 'svg'>[]} icons Icons to include.
 * @returns {Promise<Buffer>} The woff2 font.
 */
export async function buildFont(icons) {
  const fontStream = new SVGIcons2SVGFontStream({
    fontName: FONT_FAMILY,
    fontId: 'ang-icons',
    fontHeight: FONT_HEIGHT,
    descent: 0,
    normalize: true,
  });

  /** @type {string[]} */
  const chunks = [];
  const svgFont = new Promise((resolve, reject) => {
    fontStream.on('data', (chunk) => chunks.push(chunk.toString()));
    fontStream.on('end', () => resolve(chunks.join('')));
    fontStream.on('error', reject);
  });

  const ordered = [...icons].sort((a, b) => parseCodepoint(a.codepoint) - parseCodepoint(b.codepoint));
  for (const { name, codepoint, svg } of ordered) {
    const glyph = /** @type {Readable & { metadata: object }} */ (Readable.from([svg]));
    glyph.metadata = { name, unicode: [String.fromCodePoint(parseCodepoint(codepoint)), name] };
    fontStream.write(glyph);
  }
  fontStream.end();

  const ttf = svg2ttf(await svgFont, {
    ts: 0,
    version: '1.0',
    description: 'AtlasNG Icons',
    url: 'https://github.com/cns-iu/AtlasNG',
  });
  return Buffer.from(await wawoff2.compress(Buffer.from(ttf.buffer)));
}

/**
 * Builds the complete package into `outDir`, which is deleted and recreated first.
 *
 * @param {object} options Build options.
 * @param {string} options.outDir Absolute output directory.
 * @param {string} [options.projectDir] Absolute path of the icons project; defaults to this script's project.
 * @returns {Promise<Icon[]>} The icons that were built.
 * @throws {Error} When the sources are invalid or `codepoints.json` is out of date.
 */
export async function build({ outDir, projectDir = PROJECT_DIR }) {
  const sources = await loadIcons(path.join(projectDir, 'src/svg'));
  const table = await readCodepoints(path.join(projectDir, 'src/codepoints.json'));
  assertCodepoints(
    sources.map((icon) => icon.name),
    table,
  );

  const icons = prepareIcons(sources, table);
  /** @type {Map<string, string | Buffer>} */
  const files = new Map();

  files.set('index.css', renderCss(icons));
  files.set('font-face.css', renderFontFaceCss());
  files.set('index.d.css.ts', 'export {};\n');
  files.set('scss/_index.scss', renderScss(icons));
  files.set('sprite.svg', renderSprite(icons));
  files.set(FONT_FILE, await buildFont(icons));

  for (const icon of icons) {
    const literal = renderLiteral(icon);
    files.set(`svg/${icon.category}/${icon.name}.svg`, `${icon.svg}\n`);
    files.set(`literals/${icon.name}.js`, literal.js);
    files.set(`literals/${icon.name}.d.ts`, literal.dts);
  }

  const literals = renderLiteralsIndex(icons);
  files.set('literals/index.js', literals.js);
  files.set('literals/index.d.ts', literals.dts);

  const manifest = renderManifest(icons);
  files.set('manifest.json', manifest.json);
  files.set('manifest.js', manifest.js);
  files.set('manifest.d.ts', manifest.dts);

  await rm(outDir, { recursive: true, force: true });
  for (const [file, content] of [...files].sort(([a], [b]) => compareStrings(a, b))) {
    const target = path.join(outDir, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
  }
  for (const file of ['package.json', 'README.md', 'LICENSE']) {
    await copyFile(path.join(projectDir, file), path.join(outDir, file));
  }

  return icons;
}

/**
 * Throws when the codepoint table is invalid or does not match the icon names.
 *
 * @param {string[]} names Names of the icon SVGs.
 * @param {CodepointTable} table Codepoint table.
 * @throws {Error} Listing invalid entries, SVGs without codepoints, and codepoints without SVGs.
 */
function assertCodepoints(names, table) {
  const { missing, orphaned } = diffCodepoints(names, table);
  const errors = [
    ...validateCodepoints(table),
    ...missing.map((name) => `SVG without codepoint: ${name}`),
    ...orphaned.map((name) => `codepoint without SVG: ${name}`),
  ];
  if (errors.length > 0) {
    throw new Error(
      `src/codepoints.json is out of date:\n  - ${errors.join('\n  - ')}\n` +
        'Run `npx nx run icons:codepoints` and commit src/codepoints.json.',
    );
  }
}

/**
 * Assigns codepoints to new icons, retires codepoints of removed icons, and writes `src/codepoints.json`.
 *
 * @param {string} [projectDir] Absolute path of the icons project; defaults to this script's project.
 * @returns {Promise<CodepointTable>} The written table.
 * @throws {Error} When the sources or the existing table are invalid.
 */
export async function writeCodepoints(projectDir = PROJECT_DIR) {
  const sources = await loadIcons(path.join(projectDir, 'src/svg'));
  const file = path.join(projectDir, 'src/codepoints.json');
  const current = await readCodepoints(file);
  const errors = validateCodepoints(current);
  if (errors.length > 0) {
    throw new Error(`Invalid src/codepoints.json:\n  - ${errors.join('\n  - ')}`);
  }

  const table = assignCodepoints(
    current,
    sources.map((icon) => icon.name),
  );
  await writeFile(file, renderCodepoints(table));
  return table;
}

/**
 * Command-line entry point.
 *
 * @param {string[]} argv Arguments without the node executable and script path.
 * @param {string} [projectDir] Absolute path of the icons project; defaults to this script's project.
 * @returns {Promise<string>} A summary of what was done.
 */
export async function main(argv, projectDir = PROJECT_DIR) {
  const { values } = parseArgs({
    args: argv,
    options: {
      out: { type: 'string', default: DEFAULT_OUT_DIR },
      'write-codepoints': { type: 'boolean', default: false },
    },
    strict: true,
  });

  if (values['write-codepoints']) {
    const table = await writeCodepoints(projectDir);
    return `Wrote ${Object.keys(table.codepoints).length} codepoints to src/codepoints.json`;
  }

  const outDir = path.resolve(WORKSPACE_ROOT, values.out);
  const icons = await build({ outDir, projectDir });
  return `Built ${icons.length} icons into ${outDir}`;
}

/* c8 ignore start */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then(
    (summary) => process.stdout.write(`${summary}\n`),
    (error) => {
      process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
      process.exitCode = 1;
    },
  );
}
/* c8 ignore stop */
