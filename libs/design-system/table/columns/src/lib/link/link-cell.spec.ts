import { signal, type EnvironmentProviders, type Provider } from '@angular/core';
import {
  LinkHandler,
  provideLinkHandler,
  withCustomHandler,
  type LinkCommand,
  type PreparedLink,
} from '@atlasng/common';
import { CUSTOM_ELEMENT_REGISTRY } from '@atlasng/core';
import { screen } from '@testing-library/angular';
import { cellContext, renderDefinition, ROW, type TestRow } from '../testing/render-definition';
import { LinkCellDefinition, type LinkCellConfig } from './link-cell';

class MockLinkHandler implements LinkHandler {
  readonly prepareLink = vi.fn((command: LinkCommand): PreparedLink => ({ href: String(command.command) }));
  readonly navigateTo = vi.fn((): boolean => false);
  readonly isActive = vi.fn(() => signal(false));
}

describe('LinkCellDefinition', () => {
  async function setup(config: LinkCellConfig<TestRow>) {
    const handler = new MockLinkHandler();
    const providers: (Provider | EnvironmentProviders)[] = [
      { provide: CUSTOM_ELEMENT_REGISTRY, useValue: { get: vi.fn().mockReturnValue(undefined) } },
      provideLinkHandler(withCustomHandler(() => handler)),
    ];
    const result = await renderDefinition(LinkCellDefinition, cellContext({ value: ROW.url }), { config, providers });

    return { ...result, handler };
  }

  it('renders a static label and forwards the cell value as a command', async () => {
    const { handler } = await setup({ label: 'Profile' });

    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', ROW.url);
    expect(handler.prepareLink).toHaveBeenCalledWith(
      { command: ROW.url, preserveFragment: false },
      expect.any(HTMLAnchorElement),
      expect.anything(),
      expect.anything(),
    );
  });

  it('derives a label from a row property', async () => {
    await setup({ labelProp: 'name' });

    expect(screen.getByRole('link', { name: 'Ada' })).toBeInTheDocument();
  });

  it('derives a label with the configured row function', async () => {
    await setup({ labelFn: (row) => `Open ${row.name}` });

    expect(screen.getByRole('link', { name: 'Open Ada' })).toBeInTheDocument();
  });
});
