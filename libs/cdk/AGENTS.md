# CDK Library Guidance

- `@atlasng/cdk` may import `@atlasng/common` and `@atlasng/core`. Do not import `analytics`, `design-system`, or `labs`.
- Keep this library focused on low-level, reusable interaction, accessibility, overlay, portal, positioning, and focus primitives. Do not add product-specific visual components.
- Keep its API additive by default. Do not remove or change existing exports or behavior without an explicit request.
- Validate changes with `npx nx test cdk` and `npx nx lint cdk`.
