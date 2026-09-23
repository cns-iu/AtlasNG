# Core Library Guidance

- `@atlasng/core` is the lowest AtlasNG layer and must not import from another `@atlasng/*` library.
- Keep its API additive by default. Do not remove or change existing exports or behavior without an explicit request.
- Keep configuration, dependency-injection tokens, and application-wide providers framework-neutral within the AtlasNG stack; do not add feature or UI concerns here.
- Validate changes with `npx nx test core` and `npx nx lint core`.
