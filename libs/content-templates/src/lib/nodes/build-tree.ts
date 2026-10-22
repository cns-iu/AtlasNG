import {
  CONTENT_DOCUMENT_VERSION,
  ContentDocument,
  ContentNode,
  DEFAULT_CONTENT,
} from '@atlasng/content-templates/types';
import { ContentValidationError, isContentElementNode, isNamedContent } from '@atlasng/content-templates/utils';
import { Arrayable } from 'type-fest';
import { RenderElementNode, RenderNode, RenderNodeKey, RenderNodeLocation, RenderTextNode } from './render-node';

/**
 * Builds the render tree of a document synchronously, without loading anything.
 *
 * @param document Document to build.
 * @param signal Aborts every element node, e.g. when the document changes.
 * @returns The top level render nodes.
 * @throws {ContentValidationError} When the version is unsupported or a node is neither a string nor an element node.
 */
export function buildRenderTree(document: ContentDocument, signal?: AbortSignal): RenderNode[] {
  if (document.version !== CONTENT_DOCUMENT_VERSION) {
    throw new ContentValidationError('', [
      { message: `Unsupported content document version '${String(document.version)}'.`, path: ['version'] },
    ]);
  }

  return buildList(null, document.content, DEFAULT_CONTENT, signal);
}

/**
 * Builds a node or node list. A single node gets no index.
 *
 * @param parent Enclosing element, or `null` for top level content.
 * @param content Node or node list.
 * @param key Content list the nodes belong to.
 * @param signal Abort signal for top level nodes.
 * @returns The render nodes.
 */
function buildList(
  parent: RenderElementNode | null,
  content: Arrayable<ContentNode>,
  key: RenderNodeKey,
  signal?: AbortSignal,
): RenderNode[] {
  if (Array.isArray(content)) {
    return content.map((node, index) => buildNode(parent, node, key, index, signal));
  }

  return [buildNode(parent, content, key, undefined, signal)];
}

/**
 * Builds a single node and, for elements, its content.
 *
 * @param parent Enclosing element, or `null` for top level content.
 * @param node Document node.
 * @param key Content list the node belongs to.
 * @param index Index in the content list, or `undefined` for a single node.
 * @param signal Abort signal for top level nodes.
 * @returns The render node.
 * @throws {ContentValidationError} When the node is neither a string nor an element node.
 */
function buildNode(
  parent: RenderElementNode | null,
  node: ContentNode,
  key: RenderNodeKey,
  index: number | undefined,
  signal?: AbortSignal,
): RenderNode {
  if (typeof node === 'string') {
    return new RenderTextNode(parent, key, index, node);
  }
  if (!isContentElementNode(node)) {
    const location = new RenderNodeLocation(parent, key, index);
    throw new ContentValidationError(location.path, [
      { message: 'Expected a string or an object with a string `component`.' },
    ]);
  }

  const { content } = node;
  const element = new RenderElementNode(parent, key, index, node, signal);

  if (content === undefined) {
    return element;
  } else if (isNamedContent(content)) {
    for (const [name, nodes] of Object.entries(content)) {
      element.content[name] = buildList(element, nodes, name);
    }
  } else {
    element.content[DEFAULT_CONTENT] = buildList(element, content, DEFAULT_CONTENT);
  }

  return element;
}
