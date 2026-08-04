import { isAnchorElement, isAnchorLikeCustomElement, isAnchorLikeElement } from './anchor-element';

describe('isAnchorElement', () => {
  it('returns true for anchor and area elements', () => {
    const anchor = { tagName: 'A' } as Element;
    const area = { tagName: 'AREA' } as Element;

    expect(isAnchorElement(anchor)).toBe(true);
    expect(isAnchorElement(area)).toBe(true);
  });

  it('returns false for non-anchor elements', () => {
    const div = { tagName: 'DIV' } as Element;

    expect(isAnchorElement(div)).toBe(false);
  });
});

describe('isAnchorLikeCustomElement', () => {
  it('returns true when observedAttributes includes href', () => {
    const element = { tagName: 'x-link' } as Element;
    const registry = {
      get: vi.fn().mockReturnValue({ observedAttributes: ['href', 'target'] }),
    } as unknown as CustomElementRegistry;

    expect(isAnchorLikeCustomElement(element, registry)).toBe(true);
    expect(registry.get).toHaveBeenCalledWith('x-link');
  });

  it('returns false when observedAttributes does not include href', () => {
    const element = { tagName: 'x-link' } as Element;
    const registry = {
      get: vi.fn().mockReturnValue({ observedAttributes: ['target'] }),
    } as unknown as CustomElementRegistry;

    expect(isAnchorLikeCustomElement(element, registry)).toBe(false);
  });

  it('returns false when the constructor is not found', () => {
    const element = { tagName: 'x-link' } as Element;
    const registry = {
      get: vi.fn().mockReturnValue(undefined),
    } as unknown as CustomElementRegistry;

    expect(isAnchorLikeCustomElement(element, registry)).toBe(false);
  });
});

describe('isAnchorLikeElement', () => {
  it('returns false when element is undefined', () => {
    const registry = {
      get: vi.fn(),
    } as unknown as CustomElementRegistry;

    expect(isAnchorLikeElement(undefined, registry)).toBe(false);
  });

  it('returns true for native anchor elements', () => {
    const element = { tagName: 'A' } as Element;

    expect(isAnchorLikeElement(element, undefined)).toBe(true);
  });

  it('returns true for anchor-like custom elements', () => {
    const element = { tagName: 'x-link' } as Element;
    const registry = {
      get: vi.fn().mockReturnValue({ observedAttributes: ['href'] }),
    } as unknown as CustomElementRegistry;

    expect(isAnchorLikeElement(element, registry)).toBe(true);
  });

  it('returns false for non-anchor-like elements', () => {
    const element = { tagName: 'DIV' } as Element;

    expect(isAnchorLikeElement(element, undefined)).toBe(false);
  });
});
