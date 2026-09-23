# Labs Library Guidance

- `@atlasng/labs` may import `@atlasng/design-system`, `@atlasng/analytics`, `@atlasng/cdk`, `@atlasng/common`, and `@atlasng/core`.
- Labs contains experimental work-in-progress components without a stable public API. Stable libraries must not import from `labs`.
- Do not promote a labs component into `design-system` without an explicit user request.
- Validate changes with `npx nx test labs` and `npx nx lint labs`; run `npx nx test design-system` when a change also affects a promoted design-system component.
