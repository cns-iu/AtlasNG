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
  providers: [
    provideAnalytics(
      { appName: 'my-app', appVersion: '1.2.3' },
      withDefaultBackend({ endpoint: 'https://telemetry.example.org/tr' }),
      withGlobalErrorHandler(),
    ),
  ],
});
```

| Feature                                 | Purpose                                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------------------- |
| `withDefaultBackend(config)`            | Sends events to `config.endpoint` as query parameters                                        |
| `withCustomBackend(factory)`            | Replaces the backend with any object implementing `AnalyticsBackend`                         |
| `withPermissionsConfig(config)`         | Configures consent storage and cross-tab synchronization                                     |
| `withInitialPermissions(permissions)`   | Sets the permissions used until a consent decision is loaded or made                         |
| `withPermissionedStorageConfig(config)` | Configures the backing storage of `AnalyticsPermissionedStorage`                             |
| `withPermissionedStorageKeys(keys)`     | Registers keys that `AnalyticsPermissionedStorage` persists while their category is granted  |
| `withGlobalErrorHandler()`              | Installs an `ErrorHandler` that logs uncaught errors (and prints them to the console in dev) |

The default backend accepts these options (typed as `DefaultAnalyticsBackendConfig`):

- `endpoint` (required): URL that receives the serialized events.
- `useHttpClient`: send requests through Angular's `HttpClient` instead of `fetch`. Requires `provideHttpClient()`. Requests then pass through your `HttpClient` interceptors, which may attach headers such as authentication tokens to the telemetry endpoint.
- `enableServerSideTracking`: allow events during server-side rendering. Defaults to `false`. On the server, `endpoint` must be an absolute URL.
- `keepQueryParams`: keep query strings and fragments in page view and link URLs. Defaults to `false`; see [What the default backend sends](#what-the-default-backend-sends).
- `getKeyGroup`: maps a keyboard event's `key` to the `keyGroup` that is sent. Return `undefined` to send no group. Defaults to the groups listed in [What the default backend sends](#what-the-default-backend-sends); a custom mapping should not return values that reveal what the user types.
- `plugins`: extra [`analytics` plugins](https://getanalytics.io/plugins/), as an array or a factory, appended after the built-in ones.

#### Sending events from custom plugins

The default backend drops every `page`, `track`, and `identify` call that wasn't made through it, including the calls the `analytics` package makes for URL parameters (see [Anonymous ID](#anonymous-id)). A plugin added through `plugins` that sends its own calls must mark them as safe with `getDefaultBackendEventFilterMethods()`:

```ts
import { getDefaultBackendEventFilterMethods } from '@atlasng/analytics';
import { AnalyticsEventCategory, CoreEvents, createAnalyticsEvent } from '@atlasng/analytics/events';
import { AnalyticsPlugin } from 'analytics';

const FormSubmitted = createAnalyticsEvent('formSubmitted', AnalyticsEventCategory.Statistics);

const formPlugin: AnalyticsPlugin = {
  name: 'form-submitted',
  trackEnd: ({ payload, instance }) => {
    if (payload.event === CoreEvents.Submit) {
      const { createSafeOptions } = getDefaultBackendEventFilterMethods(instance);
      void instance.track(FormSubmitted, {}, createSafeOptions());
    }
  },
};
```

Safe calls are still subject to consent: they are dropped unless the user has granted the event's category.

#### What the default backend sends

Each event is sent as a GET request to `endpoint`; any query parameters already in `endpoint` are kept. Besides the event payload, every request contains the app name and version and the [anonymous ID](#anonymous-id). Some values are reduced before sending:

- **URLs:** query strings and fragments often hold tokens, search terms, or email addresses, so they are removed from page view `url` and `referrer` values and from the `href` of clicked links, and the page view `search` and `hash` values are left out. Set `keepQueryParams: true` to keep them.
- **Keyboard events:** the pressed `key` and `code` are never sent, so tracking `keydown` on an input can't record what the user types. Only the modifier flags (`altKey`, `ctrlKey`, `shiftKey`, `metaKey`) and a coarse `keyGroup` (by default `enter`, `escape`, `tab`, or `navigation`, and omitted for all other keys; see `getKeyGroup`) are sent. Each tracked key press is still a separate event, so avoid keyboard tracking on password fields.
- **Errors:** errors are sent with their name, message, and a stack trace truncated to 2000 characters. For `HttpErrorResponse` values only the name, `status`, `statusText`, and the request URL without query string or fragment are sent; the response body and message are left out. `ErrorEvent` file names also lose their query strings and fragments.

#### Anonymous ID

The default backend never sets cookies, and the only value it writes to storage is a random anonymous ID, which it sends as `sessionId` with every event:

- Until the user grants the `statistics` category, the ID is kept in memory only, so each page load gets a new one.
- Once `statistics` is granted, the ID is kept in `localStorage` under `__atlasng_analytics_anon_id__`, so it is shared across tabs and kept between visits. If consent is revoked, the key is removed and the ID is kept in memory again.

The ID is kept by `AnalyticsPermissionedStorage` from `@atlasng/analytics/permissions` (see [Consent-gated storage](#consent-gated-storage)). Use `withPermissionedStorageConfig()` to change its `storage`, for example to `sessionStorage`, or set it to `false` to keep the ID in memory only.

The consent decision itself is stored separately by `AnalyticsPermissionsManager` (see [Managing consent](#managing-consent)).

The underlying `analytics` package always parses the `an_uid`, `an_aid`, `an_trait_*`, `an_event`, and `an_prop_*` URL parameters on startup and has no option to turn this off. The default backend neutralizes them: the URL can't replace the anonymous ID, a user ID or traits from the URL are kept in memory only and never sent by the built-in telemetry, and the `identify` and `track` calls the package makes for these parameters are dropped. Plugins added through `plugins` still receive the URL values in the `userId` and `anonymousId` payload fields, so don't rely on those fields.

### Managing consent

Events are grouped into four `AnalyticsEventCategory` values: `necessary`, `statistics`, `preferences`, and `marketing`. Only `necessary` is enabled by default, and it cannot be disabled.

Error events (`CoreEvents.Error`, which `withGlobalErrorHandler()` and `TrackError` send) are `necessary`, so they're sent before and regardless of consent. They exist to detect and fix failures that stop the application from working, which is part of providing the service the user asked for. To keep them limited to that purpose, the default backend sends only the error details listed in [What the default backend sends](#what-the-default-backend-sends). A custom backend receives the raw error values and must sanitize them itself.

The `Analytics` service checks the current permissions before it passes an event to the backend, so events in a category the user hasn't granted never reach any backend, including one registered with `withCustomBackend()`. The default backend repeats the check in a plugin as a second line of defense.

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

By default, consent is saved to `localStorage` and kept in sync across tabs and across Angular applications on the same page. Use `withPermissionsConfig()` to change the `storage`, `storageKey`, `storageEvents`, or `changeEventName` settings, or set `storage: false` to disable persistence. Use `withInitialPermissions()` (or `provideInitialAnalyticsPermissions()`) to set the permissions used before any stored value is found. If another tab removes the stored value or clears the storage, the manager returns to these initial permissions.

`manager.hasDecision()` is a signal that is `false` until the user has made a choice, either in this session or in a stored value, so a cookie banner can show itself while it is `false`. `manager.permissionsSource()` tells where the current permissions came from: `'initial'` (no decision yet), `'storage'` (loaded from storage), `'local'` (set through the manager in this context), or `'external'` (received from another tab or application). Every call to `setPermissions()`, `setDefaultPermissions()`, `setFullPermissions()`, or `updatePermissions()` counts as a decision and is saved, even when the permissions don't change.

#### Consent-gated storage

`AnalyticsPermissionedStorage` keeps values in memory and persists only the keys registered with `withPermissionedStorageKeys()`, and only while their consent category is granted. Persisted values are JSON-encoded. When consent is revoked, a value is removed from storage and kept in memory again. A key with a `generate` function creates its value on first read and ignores writes. The default backend uses this for the anonymous ID.

```ts
import { provideAnalytics, withDefaultBackend, withPermissionedStorageKeys } from '@atlasng/analytics';
import { AnalyticsEventCategory } from '@atlasng/analytics/events';

provideAnalytics(
  { appName: 'my-app' },
  withDefaultBackend({ endpoint: 'https://example.com/telemetry' }),
  withPermissionedStorageKeys({
    theme: { key: 'my-app:theme', category: AnalyticsEventCategory.Preferences },
    visitorId: {
      key: 'my-app:visitor-id',
      category: AnalyticsEventCategory.Statistics,
      storage: sessionStorage, // Overrides the configured storage for this key
      generate: () => crypto.randomUUID(),
    },
  }),
);
```

Keys can be registered from several places, also with `provideAnalyticsPermissionedStorageKeys()` from `@atlasng/analytics/permissions`; when the same key is registered more than once, the last registration wins. The storage defaults to `localStorage` in the browser and to memory on the server.

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

export const FilterApplied = createAnalyticsEvent<{ filter: string; count: number }>(
  'filterApplied',
  AnalyticsEventCategory.Statistics,
);
```

```html
<button [angTrackEvent]="FilterApplied" [angTrackEventPayload]="{ filter: 'year', count: 3 }" angTrackEventOn="click">
  Apply
</button>
```

Use `MultiTrackEvent` (`[angMultiTrackEvent]`) to track several event definitions on one element.

Do not put personally identifiable information in event payloads.
