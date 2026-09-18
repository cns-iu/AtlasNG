import '@testing-library/jest-dom/vitest';

globalThis.ResizeObserver ??= class TestResizeObserver implements ResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}

  observe(target: Element): void {
    this.callback(
      [
        {
          target,
          borderBoxSize: [{ blockSize: 768, inlineSize: 1024 }],
          contentBoxSize: [{ blockSize: 768, inlineSize: 1024 }],
          contentRect: target.getBoundingClientRect(),
          devicePixelContentBoxSize: [],
        },
      ],
      this,
    );
  }

  unobserve(): void {
    return;
  }

  disconnect(): void {
    return;
  }
};
