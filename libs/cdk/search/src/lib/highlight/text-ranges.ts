import { SearchRange } from '../engine/types';
import { mergeRanges } from '../text/ranges';

/**
 * Creates DOM ranges over the text nodes of an element from offsets into its text content.
 *
 * @param root Element whose text nodes are covered.
 * @param getRanges Returns the half-open `[start, end)` ranges to cover, given the text content of the element.
 *   Ranges are clamped to the text and may be unsorted or overlap.
 * @returns One DOM range per merged range, in document order.
 */
export function createTextRanges(root: Element, getRanges: (text: string) => readonly SearchRange[]): Range[] {
  const document = root.ownerDocument;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let text = '';
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    nodes.push(node);
    text += node.data;
  }

  const clamped = getRanges(text).map(([start, end]): SearchRange => [Math.max(0, start), Math.min(text.length, end)]);
  const ranges: Range[] = [];
  let index = 0;
  let nodeStart = 0;
  // Merged ranges are sorted and non-empty, so the node position only ever moves forward
  for (const [start, end] of mergeRanges(clamped)) {
    const range = document.createRange();
    while (nodeStart + nodes[index].length <= start) {
      nodeStart += nodes[index++].length;
    }
    range.setStart(nodes[index], start - nodeStart);
    while (nodeStart + nodes[index].length < end) {
      nodeStart += nodes[index++].length;
    }
    range.setEnd(nodes[index], end - nodeStart);
    ranges.push(range);
  }
  return ranges;
}
