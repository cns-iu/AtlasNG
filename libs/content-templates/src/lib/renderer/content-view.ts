import {
  ApplicationRef,
  Binding,
  ComponentRef,
  createComponent,
  EnvironmentInjector,
  ErrorHandler,
  Injector,
  reflectComponentType,
  Renderer2,
  Type,
} from '@angular/core';
import { whenContentReady, whenElementReady } from '../resolver/boundary';
import { loadComponent } from '../resolver/load-component';
import { ResolvedContentElement, ResolvedContentNode } from '../resolver/resolved-content';
import { ComponentOrLoader, ContentComponentDefinition } from '../types/content-component-definition';
import { createInputBindings, createOptionalBindings } from './bindings';

/** Services and settings shared by every boundary of one rendered document. */
export interface ContentRenderContext {
  /** Application the created views are attached to for change detection. */
  appRef: ApplicationRef;
  /** Environment injector for created components. */
  environmentInjector: EnvironmentInjector;
  /** Element injector for created components. */
  elementInjector: Injector;
  /** Renderer used for DOM operations. */
  renderer: Renderer2;
  /** Receives every boundary failure. */
  errorHandler: ErrorHandler;
  /** Error component used when a definition declares none. */
  errorComponent: ComponentOrLoader<unknown> | undefined;
}

/** What a boundary renders: the renderer root's node list, or a node whose definition declares a placeholder. */
export type ContentBoundaryTarget =
  | { kind: 'root'; resolve: () => ResolvedContentNode[] }
  | { kind: 'element'; element: ResolvedContentElement; definition: ContentComponentDefinition };

/** Owns the component refs and nested boundaries created for one rendering of a boundary. */
class ContentScope {
  /** Created component refs. */
  readonly #refs: ComponentRef<unknown>[] = [];
  /** Nested boundaries. */
  readonly #boundaries: ContentBoundary[] = [];

  /**
   * Creates a component, attaches it for change detection, and tracks it.
   *
   * @param context Render context.
   * @param type Component class.
   * @param bindings Input bindings.
   * @param projectableNodes Nodes projected into the component's `ng-content` slots.
   * @returns The component's host element.
   */
  createComponent(
    context: ContentRenderContext,
    type: Type<unknown>,
    bindings: Binding[],
    projectableNodes?: Node[][],
  ): Node {
    const ref = createComponent(type, {
      environmentInjector: context.environmentInjector,
      elementInjector: context.elementInjector,
      bindings,
      projectableNodes,
    });
    this.#refs.push(ref);
    context.appRef.attachView(ref.hostView);
    ref.changeDetectorRef.detectChanges();
    return ref.location.nativeElement;
  }

  /**
   * Tracks a nested boundary.
   *
   * @param boundary Boundary to track.
   */
  addBoundary(boundary: ContentBoundary): void {
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
}

/**
 * Renders a node list or boundary node into a host element once it is ready.
 *
 * While waiting, a boundary node shows its placeholder. On failure, the error is reported to the `ErrorHandler` and
 * the boundary shows the definition's error component, or the configured default.
 */
export class ContentBoundary {
  /** Element the boundary's nodes are appended to. */
  readonly host: Element;
  /** Render context. */
  readonly #context: ContentRenderContext;
  /** What the boundary renders. */
  readonly #target: ContentBoundaryTarget;
  /** Scope of the currently mounted nodes. */
  #scope = new ContentScope();
  /** Currently mounted DOM nodes. */
  #mounted: Node[] = [];
  /** Whether {@link destroy} has been called. */
  #destroyed = false;

  /**
   * Creates a boundary. Call {@link start} to render.
   *
   * @param context Render context.
   * @param host Element the boundary's nodes are appended to.
   * @param target What the boundary renders.
   */
  constructor(context: ContentRenderContext, host: Element, target: ContentBoundaryTarget) {
    this.#context = context;
    this.host = host;
    this.#target = target;
  }

  /**
   * Shows the placeholder, if any, then renders the content once ready.
   *
   * @returns Settles once the content or the error component is shown, or the boundary is destroyed.
   */
  async start(): Promise<void> {
    try {
      const nodes = await this.#render();
      if (nodes) {
        this.#replace(nodes.scope, nodes.nodes);
      }
    } catch (error) {
      if (!this.#destroyed) {
        this.#context.errorHandler.handleError(error);
        await this.#showError(error);
      }
    }
  }

  /** Destroys the mounted nodes and nested boundaries. Pending work is discarded. */
  destroy(): void {
    this.#destroyed = true;
    this.#unmount();
    this.#scope.destroy();
  }

  /**
   * Shows the placeholder, waits for readiness, and builds the content in a new scope.
   *
   * @returns The built nodes and their scope, or `undefined` when destroyed meanwhile.
   */
  async #render(): Promise<{ scope: ContentScope; nodes: Node[] } | undefined> {
    const target = this.#target;
    let build: (scope: ContentScope) => Promise<Node[]>;
    if (target.kind === 'root') {
      const nodes = target.resolve();
      await whenContentReady(nodes);
      build = (scope) => this.#builder(scope).buildList(nodes);
    } else {
      const { element, definition } = target;
      if (definition.placeholder) {
        const scope = new ContentScope();
        const bindings = createOptionalBindings(definition.placeholder, { node: element.node, definition });
        this.#replace(scope, [scope.createComponent(this.#context, definition.placeholder, bindings)]);
      }
      await whenElementReady(element);
      build = async (scope) => [await this.#builder(scope).buildElement(element)];
    }

    if (this.#destroyed) {
      return undefined;
    }
    const scope = new ContentScope();
    try {
      const nodes = await build(scope);
      if (!this.#destroyed) {
        return { scope, nodes };
      }
    } catch (error) {
      scope.destroy();
      throw error;
    }
    scope.destroy();
    return undefined;
  }

  /**
   * Shows the error component, if any, in place of the current nodes.
   *
   * @param error The failure.
   */
  async #showError(error: unknown): Promise<void> {
    const target = this.#target;
    const node = target.kind === 'element' ? target.element.node : undefined;
    const definition = target.kind === 'element' ? target.definition : undefined;
    const errorComponent = definition?.error ?? this.#context.errorComponent;
    const scope = new ContentScope();
    const nodes: Node[] = [];

    try {
      if (errorComponent) {
        const type = await loadComponent(errorComponent);
        if (this.#destroyed) {
          return;
        }
        const bindings = createOptionalBindings(type, { node, definition, error });
        nodes.push(scope.createComponent(this.#context, type, bindings));
      }
    } catch (errorComponentError) {
      this.#context.errorHandler.handleError(errorComponentError);
    }
    this.#replace(scope, nodes);
  }

  /**
   * Creates a builder that tracks created components in a scope.
   *
   * @param scope Scope owning the created components.
   * @returns The builder.
   */
  #builder(scope: ContentScope): ContentBuilder {
    return new ContentBuilder(this.#context, scope);
  }

  /**
   * Replaces the mounted nodes and scope.
   *
   * @param scope New scope.
   * @param nodes New DOM nodes.
   */
  #replace(scope: ContentScope, nodes: Node[]): void {
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
}

/** Builds DOM nodes and components for ready content, bottom-up. */
class ContentBuilder {
  /** Render context. */
  readonly #context: ContentRenderContext;
  /** Scope owning the created components and nested boundaries. */
  readonly #scope: ContentScope;

  /**
   * Creates a builder.
   *
   * @param context Render context.
   * @param scope Scope owning the created components and nested boundaries.
   */
  constructor(context: ContentRenderContext, scope: ContentScope) {
    this.#context = context;
    this.#scope = scope;
  }

  /**
   * Builds a node list. Nodes that are boundaries become outlets rendering independently.
   *
   * @param nodes Ready nodes.
   * @returns The built DOM nodes, in order.
   */
  async buildList(nodes: ResolvedContentNode[]): Promise<Node[]> {
    return Promise.all(
      nodes.map(async (node) => {
        if (node.kind === 'text') {
          return this.#context.renderer.createText(node.text) as Node;
        }

        const definition = await node.definition;
        return definition.placeholder ? this.#createOutlet(node, definition) : this.buildElement(node);
      }),
    );
  }

  /**
   * Builds an element, its content first.
   *
   * @param element Ready element.
   * @returns The component's host element.
   * @throws In dev mode, when config or data keys match no input, or content targets an unknown slot.
   */
  async buildElement(element: ResolvedContentElement): Promise<Node> {
    const [definition, component, config, data] = await Promise.all([
      element.definition,
      element.component,
      element.config,
      element.data,
    ]);
    const mirror = reflectComponentType(component);
    if (!mirror) {
      throw new Error(`Component '${definition.name}' is not a component.`);
    }

    const bindings = createInputBindings(mirror, config, data, definition.name);
    const projectableNodes = await this.#project(mirror.ngContentSelectors, definition, element);
    return this.#scope.createComponent(this.#context, component, bindings, projectableNodes);
  }

  /**
   * Builds an element's content and sorts it into projection slots.
   *
   * @param selectors The component's `ng-content` selectors.
   * @param definition The element's definition.
   * @param element The element.
   * @returns Nodes per projection slot index.
   * @throws In dev mode, when content targets a slot missing from the definition or component. In prod mode such
   *   content is dropped.
   */
  async #project(
    selectors: readonly string[],
    definition: ContentComponentDefinition,
    element: ResolvedContentElement,
  ): Promise<Node[][]> {
    const projectableNodes: Node[][] = selectors.map(() => []);
    const assign = async (slot: string | undefined, nodes: ResolvedContentNode[], description: string) => {
      const selector = slot === undefined ? undefined : definition.slots?.[slot];
      const index = selector === undefined ? -1 : selectors.indexOf(selector);
      if (index === -1) {
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
          throw new Error(`Component '${definition.name}' cannot project ${description}.`);
        }
        return;
      }
      projectableNodes[index].push(...(await this.buildList(nodes)));
    };

    const assignments: Promise<void>[] = [];
    if (element.defaultContent.length > 0) {
      assignments.push(assign(definition.defaultSlot, element.defaultContent, 'content without a default slot'));
    }
    for (const [slot, nodes] of Object.entries(element.slotContent)) {
      assignments.push(assign(slot, nodes, `content into slot '${slot}'`));
    }
    await Promise.all(assignments);

    return projectableNodes;
  }

  /**
   * Creates an outlet host for a nested boundary and starts rendering it.
   *
   * @param element Boundary element.
   * @param definition Its definition.
   * @returns The outlet host element.
   */
  #createOutlet(element: ResolvedContentElement, definition: ContentComponentDefinition): Node {
    const renderer = this.#context.renderer;
    const host = renderer.createElement('ang-content-outlet') as Element;
    renderer.addClass(host, 'ang-content-outlet');
    renderer.setStyle(host, 'display', 'contents');

    const boundary = new ContentBoundary(this.#context, host, { kind: 'element', element, definition });
    this.#scope.addBoundary(boundary);
    void boundary.start();
    return host;
  }
}
