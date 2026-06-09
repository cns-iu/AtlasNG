<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

## AtlasNG Quick Start

- Stack: Nx 22 + Angular 21 monorepo, package manager is npm (`package.json` has no workspace manager override).
- Use `npx nx` for local commands in this repo (matches existing README examples and avoids global CLI drift).
- Primary projects:
  - `AtlasNG` (application)
  - `analytics`, `cdk`, `common`, `core`, `design-system` (publishable libraries)

## High-Value Commands

- Install deps: `npm install`
- List projects: `npx nx show projects`
- Serve app: `npx nx serve AtlasNG`
- Build all: `npx nx run-many -t build`
- Test all: `npx nx run-many -t test`
- Lint all: `npx nx run-many -t lint`
- Test a single project: `npx nx test <project>` (example: `npx nx test cdk`)

## Project-Specific Workflows

- Design-system Storybook:
  - Dev: `npx nx storybook design-system`
  - Static build: `npx nx build-storybook design-system`
  - Storybook tests: `npx nx test-storybook design-system`
- Compodoc for libraries:
  - Build docs: `npx nx build-compodoc <project>`
  - Live docs: `npx nx compodoc <project>`
- Local npm registry target exists at workspace root:
  - `npx nx local-registry @atlasng/monorepo`

## Testing Expectations

- Unit tests use `@nx/angular:unit-test` with coverage enabled by default.
- Workspace coverage thresholds are enforced at 85% for branches/functions/lines/statements.
- Use watch mode when iterating: `npx nx test <project> --configuration=watch`.
- When writing tests, prefer Testing Library APIs (`@testing-library/angular`, `@testing-library/dom`) over direct DOM access.
- Prefer `user-event` for interaction and `@testing-library/jest-dom` matchers for assertions on rendered DOM state.
- Import `@testing-library/jest-dom/vitest` in project `test-setup.ts` files (for example `libs/common/src/test-setup.ts`), not inside individual `*.spec.ts` files.
- Avoid low-level patterns like `querySelector`, `querySelectorAll`, manual `dispatchEvent`, and raw `element.click()` unless there is no Testing Library equivalent.

## Documentation Map (Link, Don’t Duplicate)

- Repo overview and standard commands: [README.md](README.md)
- Library docs:
  - [libs/analytics/README.md](libs/analytics/README.md)
  - [libs/cdk/README.md](libs/cdk/README.md)
  - [libs/common/README.md](libs/common/README.md)
  - [libs/core/README.md](libs/core/README.md)
  - [libs/design-system/README.md](libs/design-system/README.md)
  - [libs/labs/README.md](libs/labs/README.md)

## Documentation Expectations

- Generate JSDoc blocks for all code, including private and protected members and non-exported functions, types, constants, and helpers when they add clarity.
- Place JSDoc blocks for angular components, directives, and similar classes immediately before the class declaration, not between the decorator and the class.
- Document functions with `@param` tags for each parameter and `@returns` when the function returns a value.
- Use `@throws`, `@see`, `@deprecated`, and inline links like `{@link ...}` when they improve the API documentation.
- Keep documentation concise and accurate; prefer documenting intent, contracts, and edge cases over restating obvious implementation details.

## Agent Pitfalls

- Prefer `find`/`grep`/`sed` for shell-based searches by default; `rg` is often unavailable in this workspace.
- When generating new code, use nearby existing code as the primary guide for naming, structure, patterns, and APIs.
- `npx nx show project <name>` may open an interactive project graph UI; use `--json` for non-interactive terminal output.
- Do not edit generated coverage artifacts under `coverage/` unless explicitly requested.
