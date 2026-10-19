// @ts-check

/**
 * Shared Prettier configuration for AtlasNG and other Nx Angular workspaces.
 *
 * Uses single quotes, a 120 character line width that matches `.editorconfig`, and the Angular
 * parser for component templates. `index.html` files keep the default HTML parser because they
 * are application shells rather than Angular templates.
 *
 * @type {import('prettier').Config}
 */
const config = {
  printWidth: 120,
  singleQuote: true,
  overrides: [
    {
      files: '*.html',
      excludeFiles: 'index.html',
      options: { parser: 'angular' },
    },
  ],
};

export default config;
