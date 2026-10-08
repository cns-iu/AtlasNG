---
name: Angular Standards
description: Angular component, directive, and service conventions for workspace source files.
applyTo: 'apps/**/*.ts,libs/**/*.ts'
---

# Angular Standards

- Follow the nearest existing implementation before introducing a new pattern or abstraction.
- Generate new Angular artifacts through the applicable Nx generator; inspect the generator options and use a dry run before generation.
- Use the workspace defaults: SCSS, `{{prefix}}` selectors, and `OnPush` change detection for generated components and libraries.
- Preserve public APIs unless the task explicitly requires a breaking change.
- For design-system-owned styles, use the `{{prefix}}-<component>` and `{{prefix}}-<component>--<element-or-state>` class naming convention.
- Run the narrowest applicable Nx validation from `AGENTS.md` after a substantive change.
