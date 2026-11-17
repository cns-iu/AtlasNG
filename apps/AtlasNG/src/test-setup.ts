import '@testing-library/jest-dom/vitest';

globalThis.ResizeObserver ??= class TestResizeObserver implements ResizeObserver {
  observe(): void {
    return;
  }

  unobserve(): void {
    return;
  }

  disconnect(): void {
    return;
  }
};
