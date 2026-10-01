import { Type } from '@angular/core';
import { ContentComponentDefinition } from '../types/content-component-definition';
import { whenContentReady, whenElementReady } from './boundary';
import { ResolvedContentElement, ResolvedContentNode } from './resolved-content';

class Placeholder {}

function deferred(): { promise: Promise<void>; resolve: () => void; reject: (error: unknown) => void } {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  promise.catch(() => undefined);
  return { promise, resolve, reject };
}

function element(
  ready: Promise<void>,
  options: {
    placeholder?: boolean;
    defaultContent?: ResolvedContentNode[];
    slotContent?: Record<string, ResolvedContentNode[]>;
  } = {},
): ResolvedContentElement {
  const definition: ContentComponentDefinition = {
    name: 'test',
    component: Placeholder,
    placeholder: options.placeholder ? (Placeholder as Type<unknown>) : undefined,
  };
  return {
    kind: 'element',
    path: 'content.0',
    node: { component: 'test' },
    definition: Promise.resolve(definition),
    component: Promise.resolve(Placeholder),
    config: Promise.resolve({}),
    data: Promise.resolve({}),
    defaultContent: options.defaultContent ?? [],
    slotContent: options.slotContent ?? {},
    ready,
  };
}

async function isSettled(promise: Promise<unknown>): Promise<boolean> {
  let settled = false;
  promise.then(
    () => (settled = true),
    () => (settled = true),
  );
  await new Promise((resolve) => setTimeout(resolve));
  return settled;
}

describe('whenContentReady', () => {
  it('waits for elements and their descendants', async () => {
    const child = deferred();
    const slotChild = deferred();
    const nodes: ResolvedContentNode[] = [
      { kind: 'text', path: 'content.0', text: 'a' },
      element(Promise.resolve(), {
        defaultContent: [element(child.promise)],
        slotContent: { title: [element(slotChild.promise)] },
      }),
    ];

    const ready = whenContentReady(nodes);
    child.resolve();
    expect(await isSettled(ready)).toBe(false);

    slotChild.resolve();
    expect(await isSettled(ready)).toBe(true);
  });

  it('does not wait for nested boundaries', async () => {
    const boundary = deferred();

    await expect(whenContentReady([element(boundary.promise, { placeholder: true })])).resolves.toBeUndefined();
  });

  it('rejects with the first failure', async () => {
    const child = deferred();
    const ready = whenContentReady([element(Promise.resolve(), { defaultContent: [element(child.promise)] })]);
    child.reject(new Error('failed'));

    await expect(ready).rejects.toThrow('failed');
  });
});

describe('whenElementReady', () => {
  it('waits for the element itself even when it is a boundary', async () => {
    const own = deferred();
    const ready = whenElementReady(element(own.promise, { placeholder: true }));

    expect(await isSettled(ready)).toBe(false);
    own.resolve();
    expect(await isSettled(ready)).toBe(true);
  });
});
