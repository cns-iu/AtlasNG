## Focused Validation

| Change                                | First validation                                    |
| ------------------------------------- | --------------------------------------------------- |
| Single-library implementation or test | `npx nx test <project>` and `npx nx lint <project>` |
| Cross-library or configuration change | `npx nx affected -t lint,test,build`                |

## Token/Context Efficiency

- Prefer scoped commands (`npx nx test <project>`) over workspace-wide `run-many`/`affected` when only one project changed.
- Use `npx nx show project <name> --json` for non-interactive output; without `--json` it can open an interactive graph UI.
- Never read files under `coverage/` (generated reports, e.g. `lcov.info`, `*.html`); grep for a specific value instead of reading whole reports.
- Pipe verbose command output through `grep`/`head`/`tail` when only a subset is relevant (e.g. `npx nx run-many -t lint 2>&1 | tail -50`).

## Commit Messages

- Use a Conventional Commits subject line, for example `feat(design-system): add content section component`.
- The scope must be one allowed by [commitlint.config.mjs](commitlint.config.mjs) (Nx project names from `npx nx show projects`{{scopeNote}}); any other scope fails CI. If no allowed scope fits, omit the scope, for example `chore: update agent instructions`.
- When adding, renaming, or removing an Nx project, run `npx nx sync` so `conventionalCommits.scopes` in [.vscode/settings.json](.vscode/settings.json) matches.
- Default to a subject line only. Add a body only when it carries context that neither the subject nor the diff shows, such as the reason behind a non-obvious change, and keep it to a sentence or two.
- Do not write long paragraphs or restate the diff file by file; reviewers read the diff anyway.

## Pull Request Descriptions

- Write the description as a bulleted list of the major changes, each a short imperative sentence, for example:

  ```
  - Add content section component
  - Fix table column sorting edge case
  - Improve types for data loader configs
  ```

- Leave out minor changes such as formatting, test updates for the listed changes, and small refactors.
- Add a short note after the list only when reviewers need context the list and diff do not show, such as a breaking change or a required follow-up.

## Testing Expectations

- Unit tests use `@nx/angular:unit-test` with coverage enabled by default.
- Workspace coverage thresholds are enforced at 85% for branches/functions/lines/statements.
- Use watch mode when iterating: `npx nx test <project> --configuration=watch`.
- When writing tests, prefer Testing Library APIs (`@testing-library/angular`, `@testing-library/dom`) over direct DOM access.
- Prefer `user-event` for interaction and `@testing-library/jest-dom` matchers for assertions on rendered DOM state.
- Import `@testing-library/jest-dom/vitest` in project `test-setup.ts` files, not inside individual `*.spec.ts` files.
- Avoid low-level patterns like `querySelector`, `querySelectorAll`, manual `dispatchEvent`, and raw `element.click()` unless there is no Testing Library equivalent.

## Documentation Expectations

- Generate JSDoc blocks for all code, including private and protected members and non-exported functions, types, constants, and helpers when they add clarity.
- Do not add JSDoc blocks in test files; they are rarely helpful and tend to bloat the tests.
- Place JSDoc blocks for angular components, directives, and similar classes immediately before the class declaration, not between the decorator and the class.
- Document functions with `@param` tags for each parameter and `@returns` when the function returns a value.
- Use only JSDoc tags supported by TypeScript and the workspace tooling. Do not use `@typeParam`, because TypeScript already infers generic type parameters, or other unsupported tags; describe type-parameter intent in prose when it adds clarity.
- Use `@throws`, `@see`, `@deprecated`, and inline links like `{@link ...}` when they improve the API documentation.
- Keep documentation concise and accurate; prefer documenting intent, contracts, and edge cases over restating obvious implementation details.

## Agent Pitfalls

- Prefer `find`/`grep`/`sed` for shell-based searches by default; `rg` is often unavailable in this workspace.
- When generating new code, use nearby existing code as the primary guide for naming, structure, patterns, and APIs.
- After generating code, run `npx nx format:write` to ensure the generated files follow workspace formatting conventions.
- `npx nx show project <name>` may open an interactive project graph UI; use `--json` for non-interactive terminal output.
- Do not edit generated coverage artifacts under `coverage/` unless explicitly requested.
