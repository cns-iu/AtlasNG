/**
 * Returns whether an element is a native anchor-like tag (`<a>` or `<area>`).
 *
 * @param element Element to check.
 * @returns `true` when the element tag is `a` or `area`; otherwise `false`.
 */
export function isAnchorElement(element: Element): boolean {
  const tagName = element.tagName.toLowerCase();
  return tagName === 'a' || tagName === 'area';
}

/**
 * Returns whether a custom element is anchor-like by checking for an observed `href` attribute.
 *
 * @param element Element to check.
 * @param registry Custom element registry used to resolve the element constructor.
 * @returns `true` if the custom element observes `href`; otherwise `false`.
 */
export function isAnchorLikeCustomElement(element: Element, registry: CustomElementRegistry): boolean {
  const tagName = element.tagName.toLowerCase();
  const constructor = registry.get(tagName) as { observedAttributes?: string[] } | undefined;
  const attributes = constructor?.observedAttributes ?? [];
  return attributes.includes('href');
}

/**
 * Returns whether an element can be treated as a link target.
 *
 * Supports native anchors and custom elements that observe `href`.
 *
 * @param element Element to check.
 * @param registry Custom element registry used for custom-element checks.
 * @returns `true` when the element is native-anchor-like or custom-anchor-like.
 */
export function isAnchorLikeElement(
  element: Element | undefined,
  registry: CustomElementRegistry | undefined,
): boolean {
  return !!(element && (isAnchorElement(element) || (registry && isAnchorLikeCustomElement(element, registry))));
}
