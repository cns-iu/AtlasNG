# @atlasng/tsconfig

Shared TypeScript compiler presets for AtlasNG and other Nx Angular workspaces. The presets hold the strict compiler options the team uses everywhere, so each repository only declares what is specific to it.

## Installation

```bash
npm install --save-dev @atlasng/tsconfig
```

## Usage

Extend one of the presets from a `tsconfig.json` file.

| Preset                           | Use for                                                                                                          |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `@atlasng/tsconfig/base.json`    | Strict, environment-neutral options shared by every preset                                                       |
| `@atlasng/tsconfig/angular.json` | Angular applications and libraries (`es2023`, bundler resolution, DOM libs, decorators, strict Angular compiler) |
| `@atlasng/tsconfig/node.json`    | Node.js packages and tooling (`nodenext` modules and resolution)                                                 |

```json
{
  "extends": "@atlasng/tsconfig/angular.json",
  "compilerOptions": {
    "rootDir": ".",
    "paths": {
      "@my-org/my-lib": ["./libs/my-lib/src/index.ts"]
    }
  },
  "exclude": ["node_modules", "tmp"]
}
```

TypeScript resolves `paths`, `rootDir`, `include` and `exclude` relative to the file that declares them, so keep those settings in your own `tsconfig.base.json`.
