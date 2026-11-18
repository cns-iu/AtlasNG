---
name: analytics-tracking
description: Add analytics event tracking and event scopes to AtlasNG components. USE WHEN creating or changing a component in design-system, labs, or another library that renders buttons, links, inputs, checkboxes, toggles, selects, lists, tabs, or other interactive controls, or when reviewing a component for missing tracking.
---

# Analytics tracking for components

Every interactive control in a library component is tracked, and every component that contains one provides an event scope. The API lives in `@atlasng/analytics` (see [libs/analytics/README.md](../../../libs/analytics/README.md)).

## 1. Give the component a scope

Add a provider named after the selector without the `ang-` prefix:

```ts
@Component({
  selector: 'ang-version-control',
  imports: [TrackClick],
  templateUrl: './version-control.html',
  styleUrl: './version-control.scss',
  providers: [provideEventScope('version-control')],
})
```

- Lint (`@angular-eslint/sort-keys-in-type-decorator`) requires `providers` after `styleUrl` and before `encapsulation`/`host`. `npx nx lint <project> --fix` reorders it.
- Content projected into the component (for example `angFooterAction` buttons) also picks up this scope, so add a scope even when all actions are projected.
- Directives can provide a scope too, such as `HeaderSortTrigger` with `provideEventScope('sort')`.

## 2. Add sub-scopes when there are several controls

When a component has more than one tracked control, name each with `angEventScope` so the paths are distinguishable (`cookie-banner.allow-all`), and import `EventScope`:

```html
<button matButton angEventScope="copy" angTrackClick (click)="copyUrl()">Copy</button>
```

Skip the sub-scope when the event type or trigger already tells the controls apart, or when there is one control.

## 3. Track each control

| Control                                                      | Tracking                                                                                  |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `<button>`, `<a>`, `matButton`, `mat-list-item` links        | `angTrackClick`                                                                           |
| `<a angTextLink>`                                            | Already tracked by the `TextLink` host directive; add only a scope                        |
| Native `<input>` / `matInput`                                | `angTrackChange` (fires on commit; avoid `angTrackInput`, which fires on every keystroke) |
| `mat-checkbox`                                               | `angTrackChange` (the inner native input's `change` bubbles)                              |
| `mat-slide-toggle`                                           | `angTrackChange angTrackChangeOn="click"` (keyboard activation of the switch also clicks) |
| `mat-select`, `mat-selection-list`, `mat-autocomplete`, tabs | `injectTrackEvent()` in the output handler (see below)                                    |
| Host listeners in directives (`host: { '(click)': ... }`)    | `injectTrackEvent()` in the handler                                                       |

The directives listen for DOM events on their host element. Angular Material outputs such as `selectionChange`, `optionSelected`, and `selectedTabChange` are not DOM events, so track them from code:

```ts
/** Tracks version selections that Angular Material reports through outputs rather than DOM events. */
readonly #track = injectTrackEvent();

protected selectVersion(version: VersionControlItem<T>): void {
  this.#track(CoreEvents.Change, { trigger: 'selectionChange' });
  this.selectedVersion.set(version);
}
```

- Import `CoreEvents` from `@atlasng/analytics/events`.
- Pass only plain, serializable data. Never pass Material event objects or component references as `triggerData`; DOM `Event`s are fine.
- Do not send user-entered values (search terms, selected labels) in payloads.
- Declare `#track` after the inputs, outputs, and models, next to the other private members.

## 4. Verify

- Every interactive element in the template has a tracking directive or a `#track` call, and the component has a scope.
- Add the analytics directives to the component's `imports`; lint flags an imported `EventScope` that the template does not use.
- Run `npx nx format:write`, then `npx nx lint <project>` and `npx nx test <project>`.
- Tests that assert tracking can provide `{ provide: Analytics, useValue: { trackEvent } }` and check `payload.path` and `payload.trigger` (see `header-sort-trigger.spec.ts`).
