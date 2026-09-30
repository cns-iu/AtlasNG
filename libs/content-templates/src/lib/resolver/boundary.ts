import { ResolvedContentElement, ResolvedContentNode } from './resolved-content';

/**
 * Waits until a list of nodes, and their descendants up to nested boundaries, are ready.
 *
 * A node whose definition declares a `placeholder` is a nested boundary: only its definition is awaited, since the
 * placeholder can be shown in the meantime.
 *
 * @param nodes Nodes of a content list.
 * @returns Resolves when the list can be rendered. Rejects with the first failure.
 */
export async function whenContentReady(nodes: ResolvedContentNode[]): Promise<void> {
  await Promise.all(
    nodes.map(async (node) => {
      if (node.kind === 'element' && !(await node.definition).placeholder) {
        await whenElementReady(node);
      }
    }),
  );
}

/**
 * Waits until an element, and its descendants up to nested boundaries, are ready. The element itself is always
 * awaited, even when it is a boundary.
 *
 * @param element Element to wait for.
 * @returns Resolves when the element can be rendered. Rejects with the first failure.
 */
export async function whenElementReady(element: ResolvedContentElement): Promise<void> {
  await Promise.all([
    element.ready,
    whenContentReady(element.defaultContent),
    ...Object.values(element.slotContent).map(whenContentReady),
  ]);
}
