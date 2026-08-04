import { signal, type Signal, type WritableSignal } from '@angular/core';
import type { IsActiveMatchOptions } from '@angular/router';
import { CUSTOM_ELEMENT_REGISTRY } from '@atlasng/core';
import { render, screen } from '@testing-library/angular';
import { LinkHandler, type LinkCommand, type PreparedLink } from '../link-handler/handler';
import { provideLinkHandler, withCustomHandler } from '../link-handler/providers';
import { AnyLink } from './any-link';
import { AnyLinkActive, classListAttribute, type AnyLinkActiveOptions } from './any-link-active';

const EXACT_MATCH_OPTIONS: IsActiveMatchOptions = {
  paths: 'exact',
  queryParams: 'exact',
  fragment: 'ignored',
  matrixParams: 'ignored',
};

const SUBSET_MATCH_OPTIONS: IsActiveMatchOptions = {
  paths: 'subset',
  queryParams: 'subset',
  fragment: 'ignored',
  matrixParams: 'ignored',
};

class MockLinkHandler implements LinkHandler {
  readonly activeStates = new Map<string, WritableSignal<boolean>>();

  readonly prepareLink = vi.fn((command: LinkCommand): PreparedLink => ({
    href: String(command.command),
  }));

  readonly navigateTo = vi.fn((): boolean => false);

  readonly isActive = vi.fn((link: PreparedLink, _matchOptions?: Partial<IsActiveMatchOptions>): Signal<boolean> => {
    const state = this.activeStates.get(link.href) ?? signal(false);
    this.activeStates.set(link.href, state);
    return state;
  });

  setActive(href: string, active: boolean): void {
    const state = this.activeStates.get(href) ?? signal(false);
    this.activeStates.set(href, state);
    state.set(active);
  }
}

describe('classListAttribute', () => {
  it('splits strings and removes empty class names', () => {
    expect(classListAttribute(' active  selected current ')).toEqual(['active', 'selected', 'current']);
  });

  it('normalizes arrays and empty values', () => {
    expect(classListAttribute([' active ', '', 'selected'])).toEqual(['active', 'selected']);
    expect(classListAttribute(null)).toEqual([]);
    expect(classListAttribute(undefined)).toEqual([]);
  });
});

describe('AnyLinkActive', () => {
  async function setup(
    template: string,
    componentProperties: Record<string, unknown> = {},
    activeStates: Record<string, boolean> = {},
  ) {
    const handler = new MockLinkHandler();
    for (const [href, active] of Object.entries(activeStates)) {
      handler.setActive(href, active);
    }

    const result = await render(template, {
      imports: [AnyLink, AnyLinkActive],
      componentProperties,
      providers: [
        { provide: CUSTOM_ELEMENT_REGISTRY, useValue: { get: vi.fn().mockReturnValue(undefined) } },
        provideLinkHandler(withCustomHandler(() => handler)),
      ],
    });

    return { ...result, handler };
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('tracks AnyLink on the same element', async () => {
    const activeChange = vi.fn();
    const { fixture, handler } = await setup(
      `<a data-testid="link" angAnyLink="/one" angAnyLinkActive="active selected"
          ariaCurrentWhenActive="page" (isActiveChange)="activeChange($event)">Link</a>`,
      { activeChange },
    );
    const link = screen.getByTestId('link');

    expect(link).not.toHaveClass('active', 'selected');
    expect(link).not.toHaveAttribute('aria-current');
    expect(activeChange).not.toHaveBeenCalled();

    handler.setActive('/one', true);
    fixture.detectChanges();

    expect(link).toHaveClass('active', 'selected');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(activeChange).toHaveBeenLastCalledWith(true);

    handler.setActive('/one', false);
    fixture.detectChanges();

    expect(link).not.toHaveClass('active', 'selected');
    expect(link).not.toHaveAttribute('aria-current');
    expect(activeChange).toHaveBeenLastCalledWith(false);
  });

  it('is active when any descendant AnyLink is active', async () => {
    const { fixture, handler } = await setup(
      `<div data-testid="group" angAnyLinkActive="active">
        <a angAnyLink="/one">Link 1</a>
        <span><a angAnyLink="/two">Link 2</a></span>
      </div>`,
      {},
      { '/two': true },
    );
    const group = screen.getByTestId('group');

    expect(group).toHaveClass('active');

    handler.setActive('/two', false);
    fixture.detectChanges();
    expect(group).not.toHaveClass('active');

    handler.setActive('/one', true);
    fixture.detectChanges();
    expect(group).toHaveClass('active');
    expect(handler.isActive).toHaveBeenCalledTimes(2);
  });

  it('uses subset matching by default', async () => {
    const { handler } = await setup('<a angAnyLink="/one" angAnyLinkActive="active">Link</a>');

    expect(handler.isActive).toHaveBeenCalledWith({ href: '/one' }, SUBSET_MATCH_OPTIONS);
  });

  it.each([
    { exact: true, expected: EXACT_MATCH_OPTIONS },
    { exact: false, expected: SUBSET_MATCH_OPTIONS },
  ])('maps { exact: $exact } to router match options', async ({ exact, expected }) => {
    const { handler } = await setup(
      '<a angAnyLink="/one" angAnyLinkActive="active" [angAnyLinkActiveOptions]="options">Link</a>',
      { options: { exact } },
    );

    expect(handler.isActive).toHaveBeenCalledWith({ href: '/one' }, expected);
  });

  it('passes custom router match options to the handler', async () => {
    const options: Partial<IsActiveMatchOptions> = {
      paths: 'exact',
      queryParams: 'ignored',
      fragment: 'exact',
      matrixParams: 'subset',
    };
    const { handler } = await setup(
      '<a angAnyLink="/one" angAnyLinkActive="active" [angAnyLinkActiveOptions]="options">Link</a>',
      { options },
    );

    expect(handler.isActive).toHaveBeenCalledWith({ href: '/one' }, options);
  });

  it('re-evaluates links when match options change', async () => {
    const options = signal<AnyLinkActiveOptions>({ exact: false });
    const { fixture, handler } = await setup(
      '<a angAnyLink="/one" angAnyLinkActive="active" [angAnyLinkActiveOptions]="options()">Link</a>',
      { options },
    );

    expect(handler.isActive).toHaveBeenLastCalledWith({ href: '/one' }, SUBSET_MATCH_OPTIONS);

    options.set({ exact: true });
    fixture.detectChanges();

    expect(handler.isActive).toHaveBeenCalledTimes(2);
    expect(handler.isActive).toHaveBeenLastCalledWith({ href: '/one' }, EXACT_MATCH_OPTIONS);
  });

  it('disables matching when options are null', async () => {
    const { handler } = await setup(
      `<div data-testid="group" angAnyLinkActive="active" [angAnyLinkActiveOptions]="null">
        <a angAnyLink="/one">Link</a>
      </div>`,
      {},
      { '/one': true },
    );

    expect(screen.getByTestId('group')).not.toHaveClass('active');
    expect(handler.isActive).not.toHaveBeenCalled();
  });

  it('ignores links without a navigation command', async () => {
    const { handler } = await setup(
      `<div data-testid="group" angAnyLinkActive="active">
        <a [angAnyLink]="undefined">Link</a>
      </div>`,
    );

    expect(screen.getByTestId('group')).not.toHaveClass('active');
    expect(handler.isActive).not.toHaveBeenCalled();
  });
});
