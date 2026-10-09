---
name: atlasng-conventions
description: Team conventions for Nx Angular workspaces that use the shared AtlasNG tooling. USE WHEN writing commit messages or pull request descriptions, adding JSDoc, writing tests, generating Angular code, or choosing which Nx validation to run before handing work back.
---

# AtlasNG team conventions

These conventions apply to every workspace that runs the `@atlasng/nx-plugin:sync` generator. The full rules live in the managed section of the root `AGENTS.md`; this skill is the short checklist.

## Before you write code

- Follow the nearest existing implementation for naming, structure and APIs.
- Scaffold Angular code with the Nx generators. Run them with `--dry-run` first. The workspace defaults are SCSS, `OnPush` change detection and the selector prefix configured in `nx.json`.
- Run Nx tasks through `npx nx`, not the underlying tools.

## While you write code

- Add JSDoc to all code, including private members and non-exported helpers. Use `@param` for every parameter and `@returns` when a value is returned. Never use `@typeParam`.
- Do not add JSDoc to test files.
- In tests, prefer Testing Library queries, `user-event` and `@testing-library/jest-dom` matchers over `querySelector`, `dispatchEvent` or `element.click()`.
- Keep coverage at or above 85% for branches, functions, lines and statements.

## Before you hand work back

1. Run `npx nx format:write`.
2. Validate the narrowest scope that covers the change:
   - one project: `npx nx test <project>` and `npx nx lint <project>`
   - several projects or configuration: `npx nx affected -t lint,test,build`
3. Run `npx nx sync:check` when you added, renamed or removed a project, and `npx nx sync` if it fails.

## Commits and pull requests

- Commit subjects follow Conventional Commits. The scope is an Nx project name from `npx nx show projects`, or no scope at all.
- Add a commit body only for context the subject and diff do not show, in a sentence or two.
- Write pull request descriptions as a bulleted list of the major changes, each a short imperative sentence. Leave out formatting, test updates and small refactors.
