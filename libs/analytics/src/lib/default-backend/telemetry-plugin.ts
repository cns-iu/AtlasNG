import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { AnalyticsEvent, CoreEvents } from '@atlasng/analytics/events';
import { AnalyticsPlugin } from 'analytics';
import { serializeTelemetryData } from './telemetry-serializer';
import { AnyPluginMethodArgs } from './types';

/**
 * Configuration for telemetry transport.
 */
export interface TelemetryPluginConfig {
  /**
   * Backend endpoint that accepts serialized telemetry via query params.
   */
  endpoint: string;
  /**
   * Sends events through Angular {@link HttpClient} when enabled.
   *
   * When disabled, telemetry uses the global {@link fetch} API.
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
    const query = serializeTelemetryData(data);
    const url = `${config.endpoint}?${query}`;
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
  let event: AnalyticsEvent;
  let path: string | undefined;
  let trigger: string | undefined;
  let triggerData: unknown;
  let props: unknown;

  switch (args.payload.type) {
    case 'page':
      event = CoreEvents.PageView;
      props = args.payload.properties;
      break;
    case 'identify':
      event = CoreEvents.Identify;
      props = args.payload.traits;
      break;
    case 'track':
      event = args.payload.event;
      ({ path, trigger, triggerData, ...props } = args.payload.properties);
      break;
    default:
      throw new Error(`Unsupported telemetry payload type: ${args.payload.type}`);
  }

  return {
    sv: 0,
    sessionId: args.payload.anonymousId,
    app: args.instance.getState('context.app'),
    version: args.instance.getState('context.version'),
    event,
    path,
    trigger,
    triggerData,
    e: props,
  };
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
