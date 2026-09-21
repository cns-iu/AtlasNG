---
name: Angular Testing Standards
description: Testing conventions for AtlasNG Vitest spec and test setup files.
applyTo: '**/*.spec.ts,**/test-setup.ts'
---

# Angular Testing Standards

- Use Testing Library queries and `user-event` for user interactions.
- Assert observable behavior with `@testing-library/jest-dom` matchers.
- Avoid `querySelector`, `querySelectorAll`, manual `dispatchEvent`, and raw `element.click()` unless no Testing Library alternative exists.
- Keep `@testing-library/jest-dom/vitest` imports in project `test-setup.ts` files, not individual specs.
- Do not add JSDoc blocks to test files.
- Run `npx nx test <project>` after modifying a project's tests or tested behavior.
