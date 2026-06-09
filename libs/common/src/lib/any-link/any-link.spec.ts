import { UrlTree } from '@angular/router';
import { CUSTOM_ELEMENT_REGISTRY } from '@atlasng/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { AnyLink } from './any-link';
import { LinkHandler, type LinkAttributes, type LinkCommand, type PreparedLink } from './link-handler';

class MockLinkHandler extends LinkHandler {
  readonly prepareLink = vi.fn(
    (_command: LinkCommand, _element?: Element, attributes?: LinkAttributes): PreparedLink<Record<string, never>> => ({
      href: '/resolved',
      attributes,
      handlerContext: {},
    }),
  );

  readonly navigateTo = vi.fn((): boolean | void => false);
}

describe('AnyLink', () => {
  async function setup(
    template: string,
    componentProperties: Record<string, unknown> = { command: '/next' },
    configureHandler?: (handler: MockLinkHandler) => void,
  ) {
    const user = userEvent.setup();
    const handler = new MockLinkHandler();
    configureHandler?.(handler);

    const customElementRegistry = {
      get: vi.fn().mockReturnValue(undefined),
    };

    const result = await render(template, {
      imports: [AnyLink],
      componentProperties,
      providers: [
        { provide: LinkHandler, useValue: handler },
        { provide: CUSTOM_ELEMENT_REGISTRY, useValue: customElementRegistry },
      ],
    });

    return { ...result, user, handler };
  }

  function enableProdMode() {
    const global = globalThis as Record<string, unknown>;
    const originalNgDevMode = global['ngDevMode'];
    global['ngDevMode'] = false;
    return () => {
      global['ngDevMode'] = originalNgDevMode;
    };
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws an error when the input combination is invalid', async () => {
    const result = setup('<a data-testid="any-link" [angAnyLink]="command" [relativeTo]="relativeTo"></a>', {
      command: new UrlTree(),
      relativeTo: {},
    });

    await expect(result).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Cannot configure queryParams or fragment when using a UrlTree as the angAnyLink input value.]`,
    );
  });

  // For some reason enabling prod mode causes the TestBed to misbehave and not reset between tests
  // Skipping this test until we can figure out why
  it.skip('does not throw an error for invalid input combinations in production mode', async () => {
    const restoreProdMode = enableProdMode();
    const result = setup('<a data-testid="any-link" [angAnyLink]="command" [relativeTo]="relativeTo"></a>', {
      command: new UrlTree(),
      relativeTo: {},
    });

    await expect(result).resolves.not.toThrow();
    restoreProdMode();
  });

  it('sets href from the prepared link for anchor elements', async () => {
    await setup('<a data-testid="any-link" [angAnyLink]="command">go</a>', undefined, (handler) => {
      handler.prepareLink.mockReturnValue({
        href: '/prepared',
        handlerContext: {},
      });
    });

    expect(screen.getByTestId('any-link')).toHaveAttribute('href', '/prepared');
  });

  it('preserves initial href for non-anchor hosts', async () => {
    await setup('<div data-testid="any-link" href="/initial" [angAnyLink]="command"></div>');

    expect(screen.getByTestId('any-link')).toHaveAttribute('href', '/initial');
  });

  it('uses prepared attributes when provided and allows null to remove an attribute', async () => {
    await setup(
      '<a data-testid="any-link" [angAnyLink]="command" [target]="target" [rel]="rel" [download]="download"></a>',
      {
        command: '/next',
        target: '_self',
        rel: 'nofollow',
        download: 'initial.txt',
      },
      (handler) => {
        handler.prepareLink.mockReturnValue({
          href: '/prepared',
          attributes: {
            target: '_blank',
            rel: null,
            download: 'prepared.txt',
          },
          handlerContext: {},
        });
      },
    );

    const element = screen.getByTestId('any-link');
    expect(element).toHaveAttribute('target', '_blank');
    expect(element).not.toHaveAttribute('rel');
    expect(element).toHaveAttribute('download', 'prepared.txt');
  });

  it('falls back to directive inputs when prepared attributes are undefined', async () => {
    await setup(
      '<a data-testid="any-link" [angAnyLink]="command" [target]="target" [rel]="rel" [download]="download"></a>',
      {
        command: '/next',
        target: '_blank',
        rel: 'noopener',
        download: 'report.csv',
      },
    );

    const element = screen.getByTestId('any-link');
    expect(element).toHaveAttribute('target', '_blank');
    expect(element).toHaveAttribute('rel', 'noopener');
    expect(element).toHaveAttribute('download', 'report.csv');
  });

  it('sets tabindex=0 for non-anchor hosts with a prepared link and no initial tabindex', async () => {
    await setup('<div data-testid="any-link" [angAnyLink]="command"></div>');

    expect(screen.getByTestId('any-link')).toHaveAttribute('tabindex', '0');
  });

  it('removes tabindex for non-anchor hosts when there is no prepared link and no initial tabindex', async () => {
    await setup('<div data-testid="any-link" [angAnyLink]="command"></div>', { command: undefined });

    expect(screen.getByTestId('any-link')).not.toHaveAttribute('tabindex');
  });

  it('preserves initial tabindex on non-anchor hosts', async () => {
    await setup('<div data-testid="any-link" tabindex="-1" [angAnyLink]="command"></div>');

    expect(screen.getByTestId('any-link')).toHaveAttribute('tabindex', '-1');
  });

  it('returns native click behavior when no command is configured', async () => {
    const { user, handler } = await setup('<a data-testid="any-link" [angAnyLink]="command"></a>', {
      command: undefined,
    });
    const element = screen.getByTestId('any-link');

    await user.click(element);

    expect(handler.navigateTo).not.toHaveBeenCalled();
  });

  it('delegates click navigation with options and prevents default for anchor fallback behavior', async () => {
    const { handler } = await setup(
      `<a data-testid="any-link" [angAnyLink]="command" [skipLocationChange]="skipLocationChange"
          [browserUrl]="browserUrl" [replaceUrl]="replaceUrl" [state]="state" [info]="info"></a>`,
      {
        command: '/next',
        skipLocationChange: true,
        browserUrl: '/browser-url',
        replaceUrl: true,
        state: { from: 'test' },
        info: { source: 'spec' },
      },
    );
    handler.navigateTo.mockReturnValue(undefined);

    const element = screen.getByTestId('any-link');
    const event = new MouseEvent('click');
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    fireEvent(element, event);

    expect(handler.navigateTo).toHaveBeenCalledWith(
      expect.objectContaining({ href: '/resolved' }),
      expect.any(MouseEvent),
      {
        skipLocationChange: true,
        browserUrl: '/browser-url',
        replaceUrl: true,
        state: { from: 'test' },
        info: { source: 'spec' },
      },
    );
    expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
  });
});
