# @atlasng/analytics

Consent-aware analytics for Angular applications. Every event belongs to a consent category, and events are only sent when the user has granted that category. The library provides declarative tracking directives, hierarchical event scopes, a persisted consent manager, and a pluggable backend built on the [`analytics`](https://getanalytics.io/) package.

## Installation

```bash
npm install @atlasng/analytics
```

## Entry points

| Import path                      | Contents                                                                 |
| -------------------------------- | ------------------------------------------------------------------------ |
| `@atlasng/analytics`             | `provideAnalytics`, the `Analytics` service, tracking directives, scopes |
| `@atlasng/analytics/events`      | Event definitions, categories, and the built-in `CoreEvents`             |
| `@atlasng/analytics/permissions` | `AnalyticsPermissions` and `AnalyticsPermissionsManager`                 |

## Usage

### Configuration

Register analytics once at bootstrap. Exactly one backend is required, either `withDefaultBackend()` or `withCustomBackend()`; development builds throw an error if none or both are provided.

```ts
import { provideAnalytics, withDefaultBackend, withGlobalErrorHandler } from '@atlasng/analytics';

bootstrapApplication(App, {
  providers: [provideAnalytics({ appName: 'my-app', appVersion: '1.2.3' }, withDefaultBackend({ endpoint: 'https://telemetry.example.org/tr' }), withGlobalErrorHandler())],
});
```

| Feature                         | Purpose                                                                                      |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| `withDefaultBackend(config)`    | Sends events to `config.endpoint` as query parameters                                        |
| `withCustomBackend(factory)`    | Replaces the backend with any object implementing `AnalyticsBackend`                         |
| `withPermissionsConfig(config)` | Configures consent storage and cross-tab synchronization                                     |
| `withGlobalErrorHandler()`      | Installs an `ErrorHandler` that logs uncaught errors (and prints them to the console in dev) |

The default backend accepts these options:

- `endpoint` (required): URL that receives the serialized events.
- `useHttpClient`: send requests through Angular's `HttpClient` instead of `fetch`. Requires `provideHttpClient()`.
- `enableServerSideTracking`: allow events during server-side rendering. Defaults to `false`.
- `plugins`: extra [`analytics` plugins](https://getanalytics.io/plugins/), as an array or a factory, appended after the built-in ones.

### Managing consent

Events are grouped into four `AnalyticsEventCategory` values: `necessary`, `statistics`, `preferences`, and `marketing`. Only `necessary` is enabled by default, and it cannot be disabled.

`AnalyticsPermissionsManager` holds the current consent as a signal of immutable `AnalyticsPermissions` values:

```ts
import { inject } from '@angular/core';
import { AnalyticsEventCategory } from '@atlasng/analytics/events';
import { AnalyticsPermissionsManager } from '@atlasng/analytics/permissions';

const manager = inject(AnalyticsPermissionsManager);

manager.setFullPermissions(); // Accept all
manager.setDefaultPermissions(); // Necessary only
manager.updatePermissions((permissions) => permissions.enableCategory(AnalyticsEventCategory.Statistics));

const statisticsAllowed = manager.permissions().isCategoryEnabled(AnalyticsEventCategory.Statistics);
```

By default, consent is saved to `localStorage` and kept in sync across tabs and across Angular applications on the same page. Use `withPermissionsConfig()` to change the `storage`, `storageKey`, `storageEvents`, or `changeEventName` settings, or set `storage: false` to disable persistence. Use `provideInitialAnalyticsPermissions()` to set the permissions used before any stored value is found.

### Logging events

The quickest way to track interactions is with the directives for the built-in events: `TrackClick`, `TrackDoubleClick`, `TrackHover`, `TrackFocus`, `TrackBlur`, `TrackInput`, `TrackChange`, `TrackKeyboard`, `TrackSubmit`, `TrackReset`, and `TrackError`.

```html
<button angTrackClick>Save</button>
<button [angTrackClick]="{ action: 'export' }">Export</button>
<input angTrackInput angTrackInputOn="change" />
```

Each directive accepts an optional payload, an `…On` input to override the DOM trigger events, an `…Options` input that is passed to the backend, and a `…Disabled` input.

Group events with scopes. A scope is set in a template with `angEventScope` or in a component with `provideEventScope()`; nested scopes are joined with dots, starting from `rootScope` (or `appName`) in the analytics configuration. Directive-tracked events report the full scope path in their `path` property.

```html
<section angEventScope="search">
  <button angTrackClick>Search</button>
</section>
```

To log from code, inject the `Analytics` service:

```ts
import { inject } from '@angular/core';
import { Analytics } from '@atlasng/analytics';
import { CoreEvents } from '@atlasng/analytics/events';

const analytics = inject(Analytics);

analytics.trackPageView();
analytics.trackEvent(CoreEvents.Click, { target: 'download' });
```

### Creating custom events

Define custom events with `createAnalyticsEvent`. The payload type parameter makes `trackEvent` and the `TrackEvent` directive type-check the payload you pass.

```ts
import { AnalyticsEventCategory, createAnalyticsEvent } from '@atlasng/analytics/events';

export const FilterApplied = createAnalyticsEvent<{ filter: string; count: number }>('filterApplied', AnalyticsEventCategory.Statistics);
```

```html
<button [angTrackEvent]="FilterApplied" [angTrackEventPayload]="{ filter: 'year', count: 3 }" angTrackEventOn="click">Apply</button>
```

Use `MultiTrackEvent` (`[angMultiTrackEvent]`) to track several event definitions on one element.

Do not put personally identifiable information in event payloads.
