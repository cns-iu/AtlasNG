import {
  ApplicationRef,
  assertInInjectionContext,
  EnvironmentInjector,
  inject,
  Injector,
  Renderer2,
  Type,
} from '@angular/core';
import { DefinitionRegistry } from '@atlasng/content-blocks/definitions';
import { DataLoaderRegistry } from '@atlasng/content-blocks/loaders';
import { DataParserRegistry } from '@atlasng/content-blocks/parsers';
import { ContentDefinition, ContentNode, TypeRef } from '@atlasng/content-blocks/types';
import { LazyChainedRegistry } from '@atlasng/content-blocks/utils';
import { Arrayable } from 'type-fest';
import { CONTENT_BLOCKS_CONFIG } from '../config';
import { loadComponent } from '../pipeline/component';
import { PipelineContext } from '../pipeline/context';

/** A failed boundary, emitted by `ContentBlock.failed`. */
export interface ContentRenderFailure {
  /**
   * Document path of the boundary's content, e.g. `content.@default[1]`, or `content` for the content block's own
   * boundary.
   */
  path: string;
  /**
   * Content the boundary renders: the boundary's node, or the document's content for the content block's own
   * boundary.
   */
  content: Arrayable<ContentNode>;
  /** Definition of the boundary's node, or `undefined` for the content block's own boundary. */
  definition?: ContentDefinition;
  /** The thrown value. */
  error: unknown;
}

/** Services and settings shared by every boundary of one content block. */
export interface RenderContext extends PipelineContext {
  /** Application the created views are attached to for change detection. */
  appRef: ApplicationRef;
  /** Environment injector for created components. */
  environmentInjector: EnvironmentInjector;
  /** Element injector for created components, and the injector boundary effects run in. */
  elementInjector: Injector;
  /** Renderer used for DOM operations. */
  renderer: Renderer2;
  /**
   * Loads the configured text component on first call, so documents without text do not load it.
   *
   * @returns The text component, or `undefined` to render text as DOM text nodes.
   */
  loadTextComponent: () => Promise<Type<unknown>> | undefined;
  /** Called when a boundary fails, including after rendering, and when its error component fails to load. */
  onFailure?: (failure: ContentRenderFailure) => void;
}

/**
 * Creates the render context of a content block. Must run in the content block's injection context.
 *
 * Checks that the configured default loader and parser names are registered, without loading them.
 *
 * @param onFailure Called with every boundary failure.
 * @returns The render context.
 * @throws {Error} In dev mode, when a default name is not registered. In prod mode a warning is logged instead.
 */
export function createRenderContext(onFailure?: (failure: ContentRenderFailure) => void): RenderContext {
  assertInInjectionContext(createRenderContext);

  const config = CONTENT_BLOCKS_CONFIG.inject();
  const context: RenderContext = {
    definitions: inject(DefinitionRegistry),
    loaders: inject(DataLoaderRegistry),
    parsers: inject(DataParserRegistry),
    config,
    appRef: inject(ApplicationRef),
    environmentInjector: inject(EnvironmentInjector),
    elementInjector: inject(Injector),
    renderer: inject(Renderer2),
    loadTextComponent: createTextComponentLoader(config.textComponent),
    onFailure,
  };

  checkDefaultNames(context);
  return context;
}

/**
 * Creates a loader for the configured text component that loads it once, on first call.
 *
 * @param textComponent The configured text component, if any.
 * @returns The loader. It returns `undefined` without a text component.
 */
function createTextComponentLoader(
  textComponent: TypeRef<unknown> | undefined,
): () => Promise<Type<unknown>> | undefined {
  let result: Promise<Type<unknown>> | undefined;
  return () => textComponent && (result ??= loadComponent(textComponent));
}

/**
 * Checks that `defaultLoader`, `defaultInlineLoader`, and `defaultParser` name registered entries.
 *
 * @param context Render context.
 * @throws {Error} In dev mode, when a name is not registered. In prod mode a warning is logged instead.
 */
function checkDefaultNames({ config, loaders, parsers }: PipelineContext): void {
  const missing = [
    ...checkDefaultName(loaders, config.defaultLoader, 'defaultLoader'),
    ...checkDefaultName(loaders, config.defaultInlineLoader, 'defaultInlineLoader'),
    ...checkDefaultName(parsers, config.defaultParser, 'defaultParser'),
  ];
  if (missing.length === 0) {
    return;
  }

  const message = `Content blocks config names unregistered entries: ${missing.join(', ')}.`;
  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    throw new Error(message);
  }

  // eslint-disable-next-line no-console
  console.warn(message);
}

/**
 * Checks that a default name from the config is registered, without loading the entry.
 *
 * @param registry Registry the name must be registered in.
 * @param name The configured name, e.g. `http`.
 * @param key Config key holding the name, e.g. `defaultLoader`. Used in messages.
 * @returns A description of the unregistered name, or nothing when it is registered.
 */
function checkDefaultName(registry: LazyChainedRegistry<unknown>, name: string, key: string): string[] {
  return registry.has(name) ? [] : [`${key} '${name}'`];
}
