# Analytics Library Guidance

- `@atlasng/analytics` may import `@atlasng/core` only. Do not import `common`, `cdk`, `design-system`, or `labs`.
- Never emit analytics events before consent has been granted.
- Never include personally identifiable information in analytics events or event properties.
- Keep its API additive by default. Do not remove or change existing exports or behavior without an explicit request.
- Validate changes with `npx nx test analytics` and `npx nx lint analytics`.
