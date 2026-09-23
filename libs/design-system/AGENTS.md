# Design-System Library Guidance

- `@atlasng/design-system` may import `@atlasng/cdk`, `@atlasng/analytics`, `@atlasng/common`, and `@atlasng/core`. Do not import `@atlasng/labs`.
- For every component behavior change, update or add an accessible keyboard and screen-reader interaction test, a unit test, and a Storybook story as applicable.
- Use the root `ang-<component>` and `ang-<component>--<element-or-state>` CSS class convention for design-system-owned styles.
- Keep its API additive by default. Do not remove or change existing exports or behavior without an explicit request.
- Validate changes with `npx nx test design-system` and `npx nx lint design-system`.
