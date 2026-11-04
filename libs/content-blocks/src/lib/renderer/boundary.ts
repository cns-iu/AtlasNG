import {
  Binding,
  ComponentRef,
  computed,
  createComponent,
  effect,
  EffectRef,
  RendererStyleFlags2,
  signal,
  Type,
  untracked,
} from '@angular/core';
import { ContentDefinition, ContentBlockNode, ContentNode, TypeRef } from '@atlasng/content-blocks/types';
import { StandardSchemaV1 } from '@standard-schema/spec';
import { Arrayable } from 'type-fest';
import {
  isRenderElementNode,
  RenderElementNode,
  RenderNode,
  RenderNodeKey,
  RenderTextNode,
  ResolvedElement,
} from '../nodes/render-node';
import { loadComponent } from '../pipeline/component';
import { getContentName, getContentSelector, getContentSlot } from '../utils/projection';
import { reportRecoverableIssues } from '../validation/errors';
import { createInputBindings, createOptionalBindings } from './bindings';
import { RenderContext, ContentRenderFailure } from './render-context';

/** What a boundary renders: the content block's top level nodes, or a node whose definition declares a placeholder. */
export type BoundaryTarget =
  | { kind: 'root'; content: Arrayable<ContentNode>; nodes: () => RenderNode[] }
  | { kind: 'element'; node: RenderElementNode; definition: ContentDefinition };

/**
 * How {@link Boundary.start} settled: content shown, error shown (or nothing without an error component), or
 * destroyed.
 */
export type BoundaryOutcome = 'rendered' | 'failed' | 'destroyed';

/** Builds a boundary's DOM nodes once it is ready, creating components in the builder's scope. */
type BuildFn = (builder: BoundaryBuilder) => Promise<Node[]>;

/** Content of a node and the projection slot it goes to. */
interface ContentSlot {
  /** Content name, or `DEFAULT_CONTENT` for unkeyed content. */
  key: RenderNodeKey;
  /** Index into `projectableNodes`. */
  index: number;
}

/** Optional settings for {@link BoundaryScope.createComponent}. */
interface CreateComponentOptions {
  /** Tag name of the host element to create, if not derived from the selector. */
  host?: string;
  /** Classes added to the host element. */
  classes?: ContentBlockNode['classes'];
  /** Styles set on the host element. */
  styles?: ContentBlockNode['styles'];
  /** Nodes projected into the component's `ng-content` slots. */
  projectableNodes?: Node[][];
}

/** Owns the component refs and nested boundaries created for one rendering of a boundary. */
class BoundaryScope {
  /** Created component refs. */
  readonly #refs: ComponentRef<unknown>[] = [];
  /** Nested boundaries. */
  readonly #boundaries: Boundary[] = [];

  /**
   * Creates a component, attaches it for change detection, and tracks it.
   *
   * @param context Render context.
   * @param type Component class.
   * @param bindings Input bindings.
   * @param options Projected nodes, host tag name, and host classes and styles.
   * @returns The component's host element.
   */
  createComponent(
    context: RenderContext,
    type: Type<unknown>,
    bindings: Binding[],
    { host, classes, styles, projectableNodes }: CreateComponentOptions = {},
  ): Node {
    const ref = createComponent(type, {
      environmentInjector: context.environmentInjector,
      elementInjector: context.elementInjector,
      hostElement: host === undefined ? undefined : (context.renderer.createElement(host) as Element),
      bindings,
      projectableNodes,
    });

    const element: Element = ref.location.nativeElement;
    this.#applyClasses(context, element, classes);
    this.#applyStyles(context, element, styles);

    this.#refs.push(ref);
    context.appRef.attachView(ref.hostView);
    ref.changeDetectorRef.detectChanges();
    return element;
  }

  /**
   * Tracks a nested boundary.
   *
   * @param boundary Boundary to track.
   */
  addBoundary(boundary: Boundary): void {
    this.#boundaries.push(boundary);
  }

  /** Destroys every tracked boundary and component. */
  destroy(): void {
    for (const boundary of this.#boundaries.splice(0)) {
      boundary.destroy();
    }
    for (const ref of this.#refs.splice(0)) {
      ref.destroy();
    }
  }

  /**
   * Adds a node's classes to a host element. A string is split on whitespace. Values that are not strings are skipped,
   * since documents are untrusted JSON.
   *
   * @param context Render context.
   * @param element The host element.
   * @param classes The node's classes, if any.
   */
  #applyClasses(context: RenderContext, element: Element, classes: CreateComponentOptions['classes']): void {
    const items = Array.isArray(classes) ? classes : [classes];
    for (const item of items) {
      if (typeof item !== 'string') {
        continue;
      }

      const classNames = item.split(/\s+/).filter(Boolean);
      for (const name of classNames) {
        context.renderer.addClass(element, name);
      }
    }
  }

  /**
   * Sets a node's styles on a host element, as normalized by {@link normalizeStyle}. Values that are neither strings
   * nor numbers are skipped, since documents are untrusted JSON.
   *
   * @param context Render context.
   * @param element The host element.
   * @param styles The node's styles, if any.
   */
  #applyStyles(context: RenderContext, element: Element, styles: CreateComponentOptions['styles']): void {
    if (typeof styles !== 'object' || styles === null || Array.isArray(styles)) {
      return;
    }

    for (const [property, value] of Object.entries(styles)) {
      if (typeof value !== 'string' && typeof value !== 'number') {
        continue;
      }

      context.renderer.setStyle(element, ...normalizeStyle(property, String(value)));
    }
  }
}

/**
 * Renders a node list or boundary node into a host element once it is ready, i.e. once its own nodes and their
 * descendants up to nested boundaries are resolved.
 *
 * While waiting, a boundary node shows its placeholder. The first error of the boundary's nodes, including errors of
 * later data emissions after rendering, is reported to the `ErrorHandler` and replaces the content with the
 * definition's error component, or the configured one.
 */
export class Boundary {
  /** Element the boundary's nodes are appended to. */
  readonly host: Element;
  /** Render context. */
  readonly #context: RenderContext;
  /** What the boundary renders. */
  readonly #target: BoundaryTarget;
  /** Element nodes rendered by this boundary, i.e. not by a nested one. Their errors fail the boundary. */
  readonly #members = signal<readonly RenderElementNode[]>([]);
  /** First error of the members, or `undefined` while none failed. */
  readonly #error = computed(() => {
    const members = this.#members();
    const errors = members.map((member) => member.error());
    return errors.find<unknown>((error) => error !== undefined);
  });
  /** Scope of the currently mounted nodes. */
  #scope = new BoundaryScope();
  /** Currently mounted DOM nodes. */
  #mounted: Node[] = [];
  /** Whether the boundary failed, so it shows its error component. */
  #failed = false;
  /** Whether {@link destroy} has been called. */
  #destroyed = false;
  /** Watches {@link #members} for errors. */
  #errorWatcher?: EffectRef;

  /** Whether the boundary no longer renders content, i.e. it failed or was destroyed. */
  get #settled(): boolean {
    return this.#failed || this.#destroyed;
  }

  /**
   * Creates a boundary. Call {@link start} to render.
   *
   * @param context Render context.
   * @param host Element the boundary's nodes are appended to.
   * @param target What the boundary renders.
   */
  constructor(context: RenderContext, host: Element, target: BoundaryTarget) {
    this.host = host;
    this.#context = context;
    this.#target = target;
  }

  /**
   * Shows the placeholder, if any, then renders the content once ready. The host has `aria-busy="true"` meanwhile.
   *
   * @returns Settles once the content or the error component is shown, or the boundary is destroyed, with how it
   *   settled. A rendered boundary can still fail later, e.g. on an invalid data emission.
   * @throws {Error} When the boundary was already started.
   */
  async start(): Promise<BoundaryOutcome> {
    if (this.#errorWatcher) {
      throw new Error('Boundary already started.');
    }

    this.#initializeErrorWatcher();
    this.#setBusy(true);

    try {
      const buildFn = await this.#whenReady();
      if (!this.#settled) {
        await this.#render(buildFn);
      }
    } catch (error) {
      await this.#fail(error);
    } finally {
      this.#setBusy(false);
    }

    if (this.#destroyed) {
      return 'destroyed';
    }

    return this.#failed ? 'failed' : 'rendered';
  }

  /** Destroys the mounted nodes and nested boundaries. Pending work is discarded. */
  destroy(): void {
    this.#destroyed = true;
    this.#setBusy(false);
    this.#errorWatcher?.destroy();
    this.#unmount();
    this.#scope.destroy();
  }

  /** Fails the boundary with {@link #error} once a member fails, including after rendering. */
  #initializeErrorWatcher(): void {
    this.#errorWatcher = effect(
      () => {
        const error = this.#error();
        if (error !== undefined) {
          untracked(() => void this.#fail(error));
        }
      },
      { injector: this.#context.elementInjector },
    );
  }

  /**
   * Marks the host as busy, i.e. still loading, for assistive technology.
   *
   * @param busy Whether the boundary is loading.
   */
  #setBusy(busy: boolean): void {
    const { renderer } = this.#context;
    if (busy) {
      renderer.setAttribute(this.host, 'aria-busy', 'true');
    } else {
      renderer.removeAttribute(this.host, 'aria-busy');
    }
  }

  /**
   * Replaces the mounted nodes and scope.
   *
   * @param scope New scope.
   * @param nodes New DOM nodes.
   */
  #replace(scope: BoundaryScope, nodes: Node[]): void {
    this.#unmount();
    this.#scope.destroy();
    this.#scope = scope;
    this.#mounted = nodes;
    for (const node of nodes) {
      this.#context.renderer.appendChild(this.host, node);
    }
  }

  /** Removes the mounted DOM nodes from the host. */
  #unmount(): void {
    for (const node of this.#mounted.splice(0)) {
      this.#context.renderer.removeChild(this.host, node);
    }
  }

  /**
   * Reports the boundary's first failure and shows the error component, if any, in place of the current nodes.
   * Later failures and failures after {@link destroy} are ignored.
   *
   * @param error The failure.
   */
  async #fail(error: unknown): Promise<void> {
    if (this.#settled) {
      return;
    }

    this.#failed = true;
    this.#errorWatcher?.destroy();
    this.#reportFailure(error);
    for (const member of untracked(this.#members)) {
      member.abort(error);
    }

    await this.#renderError(error);
  }

  /**
   * Reports a failure of this boundary to the render context, with the boundary's location in the document.
   *
   * @param error The thrown value.
   */
  #reportFailure(error: unknown): void {
    const target = this.#target;
    const failure: ContentRenderFailure =
      target.kind === 'root'
        ? { path: 'content', content: target.content, error }
        : { path: target.node.path, content: target.node.source, definition: target.definition, error };

    this.#context.onFailure?.(failure);
  }

  /**
   * Shows the placeholder of an element target, then waits until the target can be rendered.
   *
   * @returns Builds the target's DOM nodes.
   */
  async #whenReady(): Promise<BuildFn> {
    const target = this.#target;
    if (target.kind === 'root') {
      const nodes = target.nodes();
      await this.#whenListReady(nodes);
      return (builder) => builder.buildList(nodes);
    }

    const { node, definition } = target;
    this.#renderPlaceholder(node, definition);

    await this.#whenElementReady(node);
    return async (builder) => [await builder.buildElement(node)];
  }

  /**
   * Waits until a node list, and its descendants up to nested boundaries, can be rendered. A nested boundary is only
   * awaited until its definition is known.
   *
   * @param nodes Nodes of a content list.
   * @returns Resolves when the list can be rendered. Rejects with the first failure.
   */
  async #whenListReady(nodes: readonly RenderNode[]): Promise<void> {
    await Promise.all(
      nodes.filter(isRenderElementNode).map(async (node) => {
        const definition = await getDefinition(node);
        if (!definition.placeholderComponent) {
          await this.#whenElementReady(node);
        }
      }),
    );
  }

  /**
   * Waits until an element and its descendants up to nested boundaries can be rendered, and makes the element a
   * member of this boundary.
   *
   * @param node Element to wait for.
   * @returns Resolves when the element can be rendered. Rejects with the first failure.
   */
  async #whenElementReady(node: RenderElementNode): Promise<void> {
    this.#members.update((members) => [...members, node]);
    await Promise.all([getResolved(node), this.#whenListReady(node.children)]);
  }

  /**
   * Builds the content in a new scope and mounts it, unless the boundary settled meanwhile.
   *
   * @param buildFn Builds the content's DOM nodes.
   * @returns Settles once the content is mounted or discarded. Rejects when building fails.
   */
  async #render(buildFn: BuildFn): Promise<void> {
    const scope = new BoundaryScope();
    try {
      const nodes = await buildFn(new BoundaryBuilder(this.#context, scope));
      if (this.#settled) {
        scope.destroy();
      } else {
        this.#replace(scope, nodes);
      }
    } catch (error) {
      scope.destroy();
      throw error;
    }
  }

  /**
   * Shows the definition's placeholder component.
   *
   * @param node The boundary's node.
   * @param definition The node's definition.
   */
  #renderPlaceholder(node: RenderElementNode, definition: ContentDefinition): void {
    const component = definition.placeholderComponent as Type<unknown>;
    const scope = new BoundaryScope();
    const bindings = createOptionalBindings(component, { node: node.source, definition });
    const nodes = [scope.createComponent(this.#context, component, bindings)];
    this.#replace(scope, nodes);
  }

  /**
   * Shows the definition's error component, or the configured one, in place of the current nodes. Shows nothing without
   * one, or when it fails to load.
   *
   * @param error The failure, passed to the error component.
   */
  async #renderError(error: unknown): Promise<void> {
    const target = this.#target;
    let node: ContentBlockNode | undefined;
    let definition: ContentDefinition | undefined;
    if (target.kind === 'element') {
      node = target.node.source;
      definition = target.definition;
    }

    const errorComponent = definition?.errorComponent ?? this.#context.config.errorComponent;
    const scope = new BoundaryScope();
    const nodes = await this.#createErrorComponent(errorComponent, scope, { node, definition, error });
    if (this.#destroyed) {
      scope.destroy();
      return;
    }

    this.#replace(scope, nodes);
  }

  /**
   * Loads and creates an error component. Failures to load or create it are reported to the `ErrorHandler`.
   *
   * @param errorComponent The error component, or `undefined` for none.
   * @param scope Scope owning the created component.
   * @param values Candidate input values: `node`, `definition`, and `error`.
   * @returns The component's host element, or nothing.
   */
  async #createErrorComponent(
    errorComponent: TypeRef<unknown> | undefined,
    scope: BoundaryScope,
    values: Record<string, unknown>,
  ): Promise<Node[]> {
    if (!errorComponent) {
      return [];
    }

    try {
      const component = await loadComponent(errorComponent);
      if (this.#destroyed) {
        return [];
      }

      const bindings = createOptionalBindings(component, values);
      return [scope.createComponent(this.#context, component, bindings)];
    } catch (error) {
      this.#reportFailure(error);
      return [];
    }
  }
}

/** Builds DOM nodes and components for ready nodes, bottom-up. */
class BoundaryBuilder {
  /** Render context. */
  readonly #context: RenderContext;
  /** Scope owning the created components and nested boundaries. */
  readonly #scope: BoundaryScope;

  /**
   * Creates a builder.
   *
   * @param context Render context.
   * @param scope Scope owning the created components and nested boundaries.
   */
  constructor(context: RenderContext, scope: BoundaryScope) {
    this.#context = context;
    this.#scope = scope;
  }

  /**
   * Builds a node list. Nodes that are boundaries render independently into their own host element.
   *
   * @param nodes Ready nodes.
   * @returns The built DOM nodes, in order.
   */
  async buildList(nodes: readonly RenderNode[]): Promise<Node[]> {
    return Promise.all(
      nodes.map(async (node) => {
        if (!isRenderElementNode(node)) {
          return this.#buildText(node);
        }

        const definition = await getDefinition(node);
        return definition.placeholderComponent ? this.#createBoundary(node, definition) : this.buildElement(node);
      }),
    );
  }

  /**
   * Builds an element, its content first. The node's `classes` and `styles` are applied to the component's host.
   *
   * @param node Ready element.
   * @returns The component's host element.
   */
  async buildElement(node: RenderElementNode): Promise<Node> {
    const resolved = await getResolved(node);
    const { component, mirror, definition } = resolved;
    const bindings = createInputBindings(mirror, resolved);
    const projectableNodes = await this.#project(node, definition, mirror.ngContentSelectors);
    const { classes, styles } = node.source;
    return this.#scope.createComponent(this.#context, component, bindings, {
      host: definition.host,
      classes,
      styles,
      projectableNodes,
    });
  }

  /**
   * Builds a text node, with the configured text component when there is one.
   *
   * @param node Text node.
   * @returns The DOM text node, or the text component's host element.
   */
  async #buildText(node: RenderTextNode): Promise<Node> {
    const textComponent = await this.#context.loadTextComponent();
    if (!textComponent) {
      return this.#context.renderer.createText(node.text) as Node;
    }

    const bindings = createOptionalBindings(textComponent, { text: node.text });
    return this.#scope.createComponent(this.#context, textComponent, bindings);
  }

  /**
   * Builds an element's content and sorts it into the component's `ng-content` slots, as mapped by the definition's
   * `content`. Unknown content names were removed or reported when the node was checked.
   *
   * @param node The element.
   * @param definition The element's definition.
   * @param selectors The component's `ng-content` selectors.
   * @returns Nodes per projection slot index.
   * @throws {ContentValidationError} In dev mode, when the definition maps content to a selector the component does not
   *   declare. In prod mode such content is dropped.
   */
  async #project(
    node: RenderElementNode,
    definition: ContentDefinition,
    selectors: readonly string[],
  ): Promise<Node[][]> {
    const projectableNodes: Node[][] = selectors.map(() => []);
    const projected = this.#getContentSlots(node, definition, selectors);
    await Promise.all(
      projected.map(async ({ key, index }) => {
        const nodes = await this.buildList(node.content[key] as RenderNode[]);
        projectableNodes[index].push(...nodes);
      }),
    );

    return projectableNodes;
  }

  /**
   * Finds the projection slot of each of an element's content keys. Keys without a slot, i.e. mapped to a selector the
   * component does not declare, are reported as recoverable issues and left out.
   *
   * @param node The element.
   * @param definition The element's definition.
   * @param selectors The component's `ng-content` selectors.
   * @returns The content keys with a slot, in content order.
   * @throws {ContentValidationError} In dev mode, when a key has no slot.
   */
  #getContentSlots(
    node: RenderElementNode,
    definition: ContentDefinition,
    selectors: readonly string[],
  ): ContentSlot[] {
    const { content: projection = {} } = definition;
    const slots: ContentSlot[] = [];
    const missing: RenderNodeKey[] = [];

    for (const key of node.contentKeys) {
      const index = getContentSlot(projection, selectors, key);
      if (index >= 0) {
        slots.push({ key, index });
      } else {
        missing.push(key);
      }
    }

    reportRecoverableIssues(
      node.path,
      missing.map((key) => this.#createMissingSlotIssue(definition, key)),
    );

    return slots;
  }

  /**
   * Creates a host element for a nested boundary and starts rendering it.
   *
   * @param node Boundary node.
   * @param definition Its definition.
   * @returns The boundary's host element.
   */
  #createBoundary(node: RenderElementNode, definition: ContentDefinition): Node {
    const { renderer } = this.#context;
    const host = renderer.createElement('ang-content-boundary') as Element;
    renderer.addClass(host, 'ang-content-boundary');
    renderer.setStyle(host, 'display', 'contents');

    const boundary = new Boundary(this.#context, host, { kind: 'element', node, definition });
    this.#scope.addBoundary(boundary);
    void boundary.start();
    return host;
  }

  /**
   * Creates the issue for content whose selector the component does not declare.
   *
   * @param definition The element's definition.
   * @param key Content name, or `DEFAULT_CONTENT` for unkeyed content.
   * @returns The issue, with a path naming the projection entry.
   */
  #createMissingSlotIssue(definition: ContentDefinition, key: RenderNodeKey): StandardSchemaV1.Issue {
    const projection = definition.content ?? {};
    const selector = getContentSelector(projection, key);
    return {
      message: `Component '${definition.name}' has no ng-content for selector '${String(selector)}'.`,
      path: ['content', getContentName(projection, key) ?? '@default'],
    };
  }
}

/**
 * Returns a node's checked definition.
 *
 * @param node Element node released by its parent.
 * @returns The definition. Rejects when the node was never started, with its abort reason when it was aborted.
 */
function getDefinition(node: RenderElementNode): Promise<ContentDefinition> {
  return node.definition ?? notStarted(node);
}

/**
 * Returns everything needed to render a node.
 *
 * @param node Element node released by its parent.
 * @returns The resolved node. Rejects when the node was never started, with its abort reason when it was aborted.
 */
function getResolved(node: RenderElementNode): Promise<ResolvedElement> {
  return node.resolved ?? notStarted(node);
}

/**
 * Creates the rejection for a node the pipeline never started.
 *
 * @param node Element node.
 * @returns A rejected promise.
 */
function notStarted(node: RenderElementNode): Promise<never> {
  const { abortSignal } = node;
  return Promise.reject(abortSignal.aborted ? abortSignal.reason : new Error(`Node '${node.path}' was not started.`));
}

/** Suffix marking a style value as important. */
const IMPORTANT_SUFFIX = '!important';

/**
 * Normalizes a style for `Renderer2.setStyle`. The property is converted to dash-case, so camel-case and dash-case keys
 * behave the same; custom properties are kept as is. A trailing `!important` is removed from the value and set as a
 * flag. The `DashCase` flag is always set, since `Important` only works with dash-case names.
 *
 * @param property Style property, e.g. `maxWidth`, `max-width`, or `--gap`.
 * @param value Style value, e.g. `40rem` or `40rem !important`.
 * @returns The property, value, and flags to pass to `setStyle`.
 */
function normalizeStyle(property: string, value: string): [string, string, RendererStyleFlags2] {
  const name = property.startsWith('--') ? property : property.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
  let flags = RendererStyleFlags2.DashCase;
  let normalizedValue = value;
  if (normalizedValue.endsWith(IMPORTANT_SUFFIX)) {
    flags |= RendererStyleFlags2.Important;
    normalizedValue = normalizedValue.slice(0, -IMPORTANT_SUFFIX.length).trimEnd();
  }

  return [name, normalizedValue, flags];
}
