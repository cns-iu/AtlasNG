import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Boundary } from './boundary';
import { RenderContext } from './render-context';

describe('Boundary', () => {
  it('throws when started twice', async () => {
    const context = {
      elementInjector: TestBed.inject(Injector),
      renderer: { setAttribute: vi.fn(), removeAttribute: vi.fn() },
      config: {},
    } as unknown as RenderContext;
    const boundary = new Boundary(context, document.createElement('div'), {
      kind: 'root',
      content: [],
      nodes: () => [],
    });

    await expect(boundary.start()).resolves.toBe('rendered');

    await expect(boundary.start()).rejects.toThrow('Boundary already started.');
    boundary.destroy();
  });
});
