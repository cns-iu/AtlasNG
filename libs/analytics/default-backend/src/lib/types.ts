// The `analytics` library typings are a bit lacking, so we define some types ourselves.

import { AnalyticsEvent, AnalyticsEventPayload } from '@atlasng/analytics/events';
import { AnalyticsInstance, PageData } from 'analytics';
import { Tagged } from 'type-fest';

/**
 * Marker type returned by analytics plugin abort callbacks.
 */
export type AbortResult = Tagged<unknown, 'AbortResult'>;

/**
 * Function signature exposed by analytics plugin hooks to abort event processing.
 *
 * @param reason Human-readable reason for aborting.
 * @returns Tagged abort result.
 */
export type AbortFn = (reason: string) => AbortResult;

/**
 * Generic argument shape for analytics plugin lifecycle methods.
 */
export interface PluginMethodArgs<C extends object, P> {
  /**
   * Payload for the current lifecycle hook.
   */
  payload: P;
  /**
   * Plugin configuration object.
   */
  config: C;
  /**
   * Active analytics instance.
   */
  instance: AnalyticsInstance;
  /**
   * Plugin registry keyed by plugin name.
   */
  plugins: Record<string, unknown>;
  /**
   * Optional callback for terminating processing of the current event.
   */
  abort?: AbortFn;
}

/**
 * Shared payload properties used across analytics lifecycle hooks.
 */
export interface CommonPayloadProps {
  /**
   * Per-event plugin configuration overrides.
   */
  options?: {
    /**
     * Enabled/disabled map for plugins by name.
     */
    plugins?: Record<string, boolean>;
    /**
     * Additional provider-specific options.
     */
    [key: string]: unknown;
  };
  /**
   * Authenticated user identifier.
   */
  userId?: string | null;
  /**
   * Anonymous session identifier.
   */
  anonymousId?: string | null;
  /**
   * Additional metadata emitted by analytics internals.
   */
  meta?: unknown;
}

/**
 * Payload shape for page lifecycle hooks.
 */
export interface PagePayload extends CommonPayloadProps {
  /**
   * Page lifecycle hook type.
   */
  type: 'pageStart' | 'page' | 'pageEnd';
  /**
   * Page analytics properties.
   */
  properties: PageData;
}

/**
 * Plugin method arguments for page lifecycle hooks.
 */
export type PageMethodArgs<C extends object> = PluginMethodArgs<C, PagePayload>;

/**
 * Payload shape for identify lifecycle hooks.
 */
export interface IdentifyPayload extends CommonPayloadProps {
  /**
   * Identify lifecycle hook type.
   */
  type: 'identifyStart' | 'identify' | 'identifyEnd';
  /**
   * User traits associated with the identify call.
   */
  traits?: Record<string, unknown>;
}

/**
 * Plugin method arguments for identify lifecycle hooks.
 */
export type IdentifyMethodArgs<C extends object> = PluginMethodArgs<C, IdentifyPayload>;

/**
 * Payload shape for track lifecycle hooks.
 */
export interface TrackPayload extends CommonPayloadProps {
  /**
   * Track lifecycle hook type.
   */
  type: 'trackStart' | 'track' | 'trackEnd';
  /**
   * Event identifier.
   */
  event: AnalyticsEvent;
  /**
   * Event payload properties.
   */
  properties: AnalyticsEventPayload;
}

/**
 * Plugin method arguments for track lifecycle hooks.
 */
export type TrackMethodArgs<C extends object> = PluginMethodArgs<C, TrackPayload>;

/**
 * Union of all plugin method arguments for page, identify, and track hooks.
 */
export type AnyPluginMethodArgs<C extends object> = PageMethodArgs<C> | IdentifyMethodArgs<C> | TrackMethodArgs<C>;
