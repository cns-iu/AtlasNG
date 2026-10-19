# @atlasng/prettier-config

Shared Prettier configuration for AtlasNG and other Nx Angular workspaces.

It sets single quotes, a print width of 120 characters, and the Angular parser for component templates (`*.html` files other than `index.html`).

## Installation

```bash
npm install --save-dev prettier @atlasng/prettier-config
```

## Usage

Reference the package from the `prettier` key of your root `package.json`:

```json
{
  "prettier": "@atlasng/prettier-config"
}
```

To change individual options, create a `prettier.config.mjs` that spreads the shared configuration instead:

```js
import atlasng from '@atlasng/prettier-config';

/** @type {import('prettier').Config} */
export default {
  ...atlasng,
  semi: false,
};
```

Keep `.prettierignore` in your repository; ignore files are not shareable.
