import { inject, Injectable } from '@angular/core';
import { Arrayable, JsonValue } from 'type-fest';
import { DataLoaderContext, DataLoaderRegistry } from '@atlasng/content-templates/loaders';
import { DataParserContext, DataParserRegistry } from '@atlasng/content-templates/parsers';
import { LazyChainedRegistry } from '@atlasng/content-templates/utils';
import { DefinitionRegistry } from '@atlasng/content-templates/definitions';
import {
  CONTENT_DOCUMENT_VERSION,
  ContentDataSource,
  ContentDocument,
  ContentElementNode,
  ContentNode,
} from '@atlasng/content-templates/types';
import { fromAsyncValue, handled } from './async-utils';
import { ContentValidationError } from './errors';
import { isContentDataSource, isContentElementNode, isContentSlots } from './guards';
import { loadComponent } from './load-component';
import { ResolvedContentElement, ResolvedContentNode } from './resolved-content';
import { validateConfig, validateData } from './validation';

/** Context passed to both the loader and the parser of a data value. */
type DataContext = DataLoaderContext & DataParserContext;

/** A parser reference in its object form. */
type TypedConfig = { type: string; [key: string]: JsonValue };

/**
 * Resolves content documents into trees of {@link ResolvedContentNode}s.
 *
 * Resolving starts loading definitions, components, and data for every node at once, regardless of tree position.
 * Provided by `provideContentTemplates` and uses the registries of the same injector.
 */
@Injectable()
export class ContentResolver {
  /** Component definitions. */
  readonly #definitions = inject(DefinitionRegistry);
  /** Data loaders. */
  readonly #loaders = inject(DataLoaderRegistry);
  /** Data parsers. */
  readonly #parsers = inject(DataParserRegistry);

  /**
   * Resolves a document.
   *
   * @param document Document to resolve.
   * @param signal Aborts pending data loads, e.g. when the document changes.
   * @returns The resolved top-level nodes.
   * @throws {ContentValidationError} When the document version is unsupported or a node is neither a string nor an
   *   element node.
   */
  resolve(document: ContentDocument, signal: AbortSignal): ResolvedContentNode[] {
    if (document.version !== CONTENT_DOCUMENT_VERSION) {
      throw new ContentValidationError('', [
        { message: `Unsupported content document version '${String(document.version)}'.`, path: ['version'] },
      ]);
    }

    return this.#resolveList(document.content, 'content', signal);
  }

  /**
   * Resolves a node or node list.
   *
   * @param content Node or node list.
   * @param path Path of the content.
   * @param signal Abort signal for data loads.
   * @returns The resolved nodes.
   * @throws {ContentValidationError} When a node is neither a string nor an element node.
   */
  #resolveList(content: Arrayable<ContentNode>, path: string, signal: AbortSignal): ResolvedContentNode[] {
    const nodes = Array.isArray(content) ? content : [content];
    return nodes.map((node, index) => this.#resolveNode(node, `${path}.${index}`, signal));
  }

  /**
   * Resolves a single node.
   *
   * @param node Node to resolve.
   * @param path Path of the node.
   * @param signal Abort signal for data loads.
   * @returns The resolved node.
   * @throws {ContentValidationError} When the node is neither a string nor an element node.
   */
  #resolveNode(node: ContentNode, path: string, signal: AbortSignal): ResolvedContentNode {
    if (typeof node === 'string') {
      return { kind: 'text', path, text: node };
    }
    if (!isContentElementNode(node)) {
      throw new ContentValidationError(path, [
        { message: 'Expected a string or an object with a string `component`.' },
      ]);
    }

    return this.#resolveElement(node, path, signal);
  }

  /**
   * Resolves an element node and, recursively, its content.
   *
   * @param node Element node to resolve.
   * @param path Path of the node.
   * @param signal Abort signal for data loads.
   * @returns The resolved element.
   * @throws {ContentValidationError} When a descendant is neither a string nor an element node.
   */
  #resolveElement(node: ContentElementNode, path: string, signal: AbortSignal): ResolvedContentElement {
    const context: DataContext = { node, signal };
    const definition = handled(getEntry(this.#definitions, node.component, 'component definition'));
    const component = handled(definition.then((resolved) => loadComponent(resolved.component)));
    const config = handled(definition.then((resolved) => validateConfig(resolved, node, path)));

    const loaded: Record<string, Promise<unknown>> = {};
    for (const [key, value] of Object.entries(node.data ?? {})) {
      loaded[key] = handled(this.#loadData(value, key, path, context));
    }
    const data = handled(definition.then((resolved) => validateData(resolved, loaded, path)));
    const ready = handled(Promise.all([definition, component, config, data]).then(() => undefined));

    const content = node.content;
    let defaultContent: ResolvedContentNode[] = [];
    const slotContent: Record<string, ResolvedContentNode[]> = {};
    if (content !== undefined && isContentSlots(content)) {
      for (const [slot, slotNodes] of Object.entries(content)) {
        slotContent[slot] = this.#resolveList(slotNodes, `${path}.content.${slot}`, signal);
      }
    } else if (content !== undefined) {
      defaultContent = this.#resolveList(content, `${path}.content`, signal);
    }

    return { kind: 'element', path, node, definition, component, config, data, defaultContent, slotContent, ready };
  }

  /**
   * Loads a single data value.
   *
   * @param value Data value from the node: an inline array or a data source.
   * @param key Data name, used in errors.
   * @param path Path of the node, used in errors.
   * @param context Context passed to loaders and parsers.
   * @returns The loaded and parsed value.
   */
  async #loadData(
    value: unknown[] | ContentDataSource,
    key: string,
    path: string,
    context: DataContext,
  ): Promise<unknown> {
    if (Array.isArray(value)) {
      return value;
    }
    if (!isContentDataSource(value)) {
      throw new ContentValidationError(path, [
        { message: 'Expected an array or an object with a string `type`.', path: ['data', key] },
      ]);
    }

    return this.#loadSource(value, context);
  }

  /**
   * Loads a data source with its loader and applies its parser, if any.
   *
   * @param source Data source.
   * @param context Context passed to the loader and parser.
   * @returns The loaded and parsed value.
   */
  async #loadSource(source: ContentDataSource, context: DataContext): Promise<unknown> {
    const { parser: parserReference, ...loaderConfig } = source;
    const loader = await getEntry(this.#loaders, loaderConfig.type, 'data loader');
    const value = await fromAsyncValue(loader.load(loaderConfig, context), context.signal);
    if (parserReference === undefined) {
      return value;
    }

    const parserConfig = toTypedConfig(parserReference);
    const parser = await getEntry(this.#parsers, parserConfig.type, 'data parser');
    return parser.parse(value, parserConfig, context);
  }
}

/**
 * Normalizes a parser reference to its object form. Objects are returned as is.
 *
 * @param reference Name or config object.
 * @returns The config object.
 */
function toTypedConfig(reference: string | TypedConfig): TypedConfig {
  return typeof reference === 'string' ? { type: reference } : reference;
}

/**
 * Looks up a registry entry, turning a miss into a rejection.
 *
 * @param registry Registry to look up.
 * @param name Registered name.
 * @param kind Entry kind, used in the error message, e.g. `data loader`.
 * @returns The value. Rejects when `name` is not registered or its factory fails.
 */
function getEntry<T>(registry: LazyChainedRegistry<T>, name: string, kind: string): Promise<T> {
  return registry.get(name) ?? Promise.reject(new Error(`Unknown ${kind} '${name}'.`));
}
