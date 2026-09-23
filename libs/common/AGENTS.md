# Common Library Guidance

- `@atlasng/common` may import `@atlasng/core` only. Do not import `cdk`, `analytics`, `design-system`, or `labs`.
- Keep utilities, directives, pipes, guards, and shared types broadly reusable. Move feature-specific or UI-specific behavior to its owning library instead.
- Keep its API additive by default. Do not remove or change existing exports or behavior without an explicit request.
- Validate changes with `npx nx test common` and `npx nx lint common`.
