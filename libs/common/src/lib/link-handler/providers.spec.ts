import { signal, Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LinkHandler, type LinkCommand, type PreparedLink } from './handler';
import {
  provideLinkHandler,
  withCustomHandler,
  withRouterHandler,
  withRouterlessHandler,
  type LinkHandlerFeature,
} from './providers';
import { RouterLinkHandler } from './router-handler';
import { RouterlessLinkHandler } from './routerless-handler';

class MockLinkHandler implements LinkHandler {
  prepareLink(command: LinkCommand): PreparedLink {
    return { href: String(command.command) };
  }

  navigateTo(): boolean {
    return false;
  }

  isActive(): Signal<boolean> {
    return signal(false);
  }
}

function createMockLinkHandler(): MockLinkHandler {
  return new MockLinkHandler();
}

function setup(...features: LinkHandlerFeature[]): void {
  TestBed.configureTestingModule({
    providers: [provideLinkHandler(...features)],
  });
}

function runWithProdMode<T>(callback: () => T): T {
  const global = globalThis as Record<string, unknown>;
  const originalNgDevMode = global['ngDevMode'];
  global['ngDevMode'] = false;
  try {
    return callback();
  } finally {
    global['ngDevMode'] = originalNgDevMode;
  }
}

describe('withCustomHandler', () => {
  it('provides a custom handler from a factory', () => {
    const handler = new MockLinkHandler();

    setup(withCustomHandler(() => handler));

    expect(TestBed.inject(LinkHandler)).toBe(handler);
  });
});

describe('withRouterHandler', () => {
  it('provides RouterLinkHandler when selected', () => {
    setup(withRouterHandler());

    expect(TestBed.inject(LinkHandler)).toBe(TestBed.inject(RouterLinkHandler));
  });
});

describe('withRouterlessHandler', () => {
  it('keeps the default RouterlessLinkHandler when selected', () => {
    setup(withRouterlessHandler());

    expect(TestBed.inject(LinkHandler)).toBe(TestBed.inject(RouterlessLinkHandler));
  });
});

describe('provideLinkHandler', () => {
  it('throws in dev mode when multiple handler features are configured', () => {
    expect(() => setup(withCustomHandler(createMockLinkHandler), withRouterHandler())).toThrow(
      'Only one link handler can be provided.',
    );
  });

  it('skips duplicate handler validation in production mode', () => {
    const providers = runWithProdMode(() =>
      provideLinkHandler(withCustomHandler(createMockLinkHandler), withRouterHandler()),
    );
    TestBed.configureTestingModule({ providers: [providers] });

    expect(TestBed.inject(LinkHandler)).toBeInstanceOf(RouterLinkHandler);
  });
});
