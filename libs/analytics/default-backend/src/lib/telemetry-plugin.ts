import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { AnalyticsEvent, CoreEvents } from '@atlasng/analytics/events';
import { AnalyticsPlugin } from 'analytics';
import { ANONYMOUS_ID_KEY } from './anonymous-id';
import { serializeTelemetryData, stripQueryAndFragment, TelemetrySerializerOptions } from './telemetry-serializer';
import { AnyPluginMethodArgs } from './types';

/**
 * Configuration for telemetry transport and serialization.
 */
export interface TelemetryPluginConfig extends TelemetrySerializerOptions {
  /**
   * Backend endpoint that accepts serialized telemetry via query params.
   */
  endpoint: string;
  /**
   * Sends events through Angular {@link HttpClient} when enabled.
   *
   * When disabled, telemetry uses the global {@link fetch} API.
   * Note that requests sent through `HttpClient` pass through the application's
   * interceptors, which may, for example, attach authentication headers.
   */
  useHttpClient?: boolean;
}

/**
 * Builds an analytics plugin that forwards events to the telemetry endpoint.
 *
 * @param config Telemetry plugin configuration.
 * @returns Analytics plugin implementation.
 */
export function telemetryPlugin(config: TelemetryPluginConfig): AnalyticsPlugin {
  const http = config.useHttpClient ? inject(HttpClient) : null;
  /**
   * Serializes and sends telemetry for any supported analytics payload.
   *
   * @param args Plugin invocation arguments.
   */
  const handleEvent = (args: AnyPluginMethodArgs<TelemetryPluginConfig>): void => {
    const data = prepareTelemetryData(args);
    const query = serializeTelemetryData(data, args.config);
    const url = buildTelemetryUrl(args.config.endpoint, query);
    sendTelemetry(url, http);
  };

  return {
    name: 'atlasng-telemetry',
    config,
    page: handleEvent,
    identify: handleEvent,
    track: handleEvent,
  };
}

/**
 * Converts an analytics plugin payload into the normalized telemetry schema.
 *
 * @param args Plugin invocation arguments.
 * @returns Plain object suitable for telemetry serialization.
 * @throws Error when the payload type is unsupported.
 */
function prepareTelemetryData(args: AnyPluginMethodArgs<TelemetryPluginConfig>): object {
  const { config, instance, payload } = args;
  const { keepQueryParams } = config;
  let event: AnalyticsEvent;
  let path: string | undefined;
  let trigger: string | undefined;
  let triggerData: unknown;
  let props: unknown;

  switch (payload.type) {
    case 'page':
      event = CoreEvents.PageView;
      props = keepQueryParams ? payload.properties : stripPageQueryParams(payload.properties);
      break;
    case 'identify':
      event = CoreEvents.Identify;
      props = payload.traits;
      break;
    case 'track':
      event = payload.event;
      ({ path, trigger, triggerData, ...props } = payload.properties);
      break;
    default:
      throw new Error(`Unsupported telemetry payload type: ${args.payload.type}`);
  }

  return {
    sv: 0,
    // Read the ID from storage rather than the payload: the payload's ID can be set with the `an_aid` URL parameter
    sessionId: instance.storage.getItem(ANONYMOUS_ID_KEY),
    app: instance.getState('context.app'),
    version: instance.getState('context.version'),
    event,
    path,
    trigger,
    triggerData,
    e: props,
  };
}

/**
 * Removes query strings and fragments from page view properties.
 *
 * @param properties Page view properties from the `analytics` package.
 * @returns Copy of the properties without `search`/`hash` and with sanitized `url`/`referrer`.
 */
function stripPageQueryParams(properties: Record<string, unknown>): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { search, hash, ...rest } = properties;
  for (const key of ['url', 'referrer']) {
    const value = rest[key];
    if (typeof value === 'string') {
      rest[key] = stripQueryAndFragment(value);
    }
  }
  return rest;
}

/**
 * Appends serialized telemetry to the endpoint, keeping any query parameters the endpoint already has.
 *
 * @param endpoint Absolute endpoint URL, or a URL relative to the current page.
 * @param query Serialized telemetry query string.
 * @returns Full telemetry URL.
 */
function buildTelemetryUrl(endpoint: string, query: string): string {
  const url = new URL(endpoint, globalThis.location?.href);
  for (const [key, value] of new URLSearchParams(query)) {
    url.searchParams.append(key, value);
  }
  return url.href;
}

/**
 * Sends telemetry to the configured endpoint.
 *
 * @param url Fully built telemetry URL including query parameters.
 * @param http Http client instance when enabled; otherwise null.
 */
function sendTelemetry(url: string, http: HttpClient | null): void {
  /**
   * Handles transport errors for both HttpClient and fetch requests.
   *
   * @param error Error object emitted by the transport layer.
   */
  const onError = (error: unknown): void => {
    // eslint-disable-next-line no-console
    console.error('Failed to send telemetry data', error);
  };

  if (http) {
    http.get(url, { cache: 'no-store', keepalive: true }).subscribe({ error: onError });
  } else {
    fetch(url, { method: 'GET', cache: 'no-store', keepalive: true }).catch(onError);
  }
}
