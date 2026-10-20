import { InteractivityChecker } from '@angular/cdk/a11y';
import { OverlayContainer, OverlayRef } from '@angular/cdk/overlay';
import { Location } from '@angular/common';
import { SpyLocation } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { RichTooltip, RichTooltipAction, RichTooltipContent } from './rich-tooltip';
import { RichTooltipTrigger } from './rich-tooltip-trigger';

const IMPORTS = [RichTooltip, RichTooltipAction, RichTooltipContent, RichTooltipTrigger];

const INTERACTIVITY_CHECKER: Partial<InteractivityChecker> = {
  isDisabled: (element) => element.hasAttribute('disabled'),
  isVisible: () => true,
  isFocusable: () => true,
  isTabbable: (element) => element.tabIndex >= 0,
};

const TEMPLATE = `
  <ang-rich-tooltip #tip tagline="Title" description="Description">
    <button type="button" angRichTooltipAction>Learn more</button>
  </ang-rich-tooltip>
  <button type="button" [angRichTooltipTriggerFor]="tip" (opened)="opened()" (closed)="closed()">Open</button>
  <button type="button">Elsewhere</button>
`;

/**
 * Renders a trigger with a panel that contains one action.
 */
async function setup() {
  const user = userEvent.setup();
  const opened = vi.fn();
  const closed = vi.fn();
  const result = await render(TEMPLATE, {
    imports: IMPORTS,
    componentProperties: { opened, closed },
    providers: [
      { provide: Location, useClass: SpyLocation },
      // jsdom has no layout, so the default checker treats every element as invisible and unfocusable.
      { provide: InteractivityChecker, useValue: INTERACTIVITY_CHECKER },
    ],
  });
  const trigger = screen.getByRole('button', { name: 'Open' });
  return { ...result, user, opened, closed, trigger };
}

describe('RichTooltipTrigger', () => {
  it('toggles the panel on click and emits opened and closed', async () => {
    const { user, opened, closed, trigger } = await setup();

    await user.click(trigger);

    expect(screen.getByRole('dialog', { name: 'Title' })).toBeInTheDocument();
    expect(opened).toHaveBeenCalledOnce();

    await user.click(trigger);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(closed).toHaveBeenCalledOnce();
  });

  it('reflects the open state in its aria attributes', async () => {
    const { user, trigger } = await setup();

    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).not.toHaveAttribute('aria-controls');

    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', screen.getByRole('dialog').id);

    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).not.toHaveAttribute('aria-controls');
  });

  it('keeps focus on the trigger when it opens', async () => {
    const { user, fixture, trigger } = await setup();

    await user.click(trigger);
    await fixture.whenStable();

    expect(trigger).toHaveFocus();
  });

  describe('focus order', () => {
    const PANEL_CONTENT = `
      <button type="button" angRichTooltipAction>First action</button>
      <button type="button" angRichTooltipAction>Second action</button>
    `;

    async function setupFocusOrder(panelContent = PANEL_CONTENT) {
      const user = userEvent.setup();
      await render(
        `
          <ang-rich-tooltip #tip tagline="Title">${panelContent}</ang-rich-tooltip>
          <button type="button">Before</button>
          <button type="button" [angRichTooltipTriggerFor]="tip">Open</button>
          <button type="button">After</button>
        `,
        { imports: IMPORTS, providers: [{ provide: InteractivityChecker, useValue: INTERACTIVITY_CHECKER }] },
      );
      const trigger = screen.getByRole('button', { name: 'Open' });
      await user.click(trigger);
      return { user, trigger };
    }

    it('moves from the trigger through the panel to the element after the trigger', async () => {
      const { user } = await setupFocusOrder();

      await user.tab();
      expect(screen.getByRole('button', { name: 'First action' })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: 'Second action' })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('moves back through the panel to the trigger and then before it', async () => {
      const { user, trigger } = await setupFocusOrder();

      await user.tab();
      await user.tab();
      await user.tab({ shift: true });
      expect(screen.getByRole('button', { name: 'First action' })).toHaveFocus();

      await user.tab({ shift: true });
      expect(trigger).toHaveFocus();

      await user.tab({ shift: true });
      expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
    });

    it('leaves the panel instead of cycling back into it when nothing follows the trigger', async () => {
      const user = userEvent.setup();
      await render(
        `
          <ang-rich-tooltip #tip tagline="Title">
            <button type="button" angRichTooltipAction>Only action</button>
          </ang-rich-tooltip>
          <button type="button" [angRichTooltipTriggerFor]="tip">Open</button>
        `,
        { imports: IMPORTS, providers: [{ provide: InteractivityChecker, useValue: INTERACTIVITY_CHECKER }] },
      );
      await user.click(screen.getByRole('button', { name: 'Open' }));

      await user.tab();
      const action = screen.getByRole('button', { name: 'Only action' });
      expect(action).toHaveFocus();

      await user.tab();

      expect(screen.getByRole('dialog')).not.toContainElement(document.activeElement as HTMLElement);
    });

    it('skips the panel when it has no tabbable elements', async () => {
      const { user } = await setupFocusOrder('<ang-rich-tooltip-content>Only text</ang-rich-tooltip-content>');

      await user.tab();

      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    });

    it('ignores Tab with other modifier keys', async () => {
      const { user, trigger } = await setupFocusOrder();

      await user.keyboard('{Control>}{Tab}{/Control}');
      expect(screen.getByRole('button', { name: 'First action' })).not.toHaveFocus();

      await user.tab();
      await user.keyboard('{Control>}{Tab}{/Control}');
      expect(trigger).not.toHaveFocus();
    });

    it('does not move focus into a closed panel', async () => {
      const { user, trigger } = await setupFocusOrder();

      await user.click(trigger);
      await user.tab();

      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    });
  });

  it('closes on outside click without moving focus back to the trigger', async () => {
    const { user, closed, trigger } = await setup();
    const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });

    await user.click(trigger);
    await user.click(elsewhere);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(closed).toHaveBeenCalledOnce();
    expect(elsewhere).toHaveFocus();
  });

  it('closes on Escape and restores focus to the trigger', async () => {
    const { user, fixture, trigger } = await setup();

    await user.click(trigger);
    await fixture.whenStable();
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('ignores Escape with a modifier key', async () => {
    const { user, trigger } = await setup();

    await user.click(trigger);
    await user.keyboard('{Shift>}{Escape}{/Shift}');

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes when the panel is closed', async () => {
    const { user, fixture, closed, trigger } = await setup();

    await user.click(trigger);
    fixture.debugElement.children[0].componentInstance.close();
    fixture.detectChanges();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(closed).toHaveBeenCalledOnce();
  });

  it('closes when navigating through history and can open again', async () => {
    const { user, fixture, closed, trigger } = await setup();
    const location = TestBed.inject(Location) as SpyLocation;

    await user.click(trigger);
    location.simulateUrlPop('/');
    await fixture.whenStable();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(closed).toHaveBeenCalledOnce();

    await user.click(trigger);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes when the overlay is detached externally', async () => {
    const { user, fixture, closed, trigger } = await setup();
    const attachSpy = vi.spyOn(OverlayRef.prototype, 'attach');

    await user.click(trigger);
    (attachSpy.mock.contexts[0] as OverlayRef).detach();
    attachSpy.mockRestore();
    fixture.detectChanges();

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(closed).toHaveBeenCalledOnce();
  });

  it('closes programmatically', async () => {
    const { user, fixture, closed, trigger } = await setup();
    const triggerDirective = fixture.debugElement.children[1].injector.get(RichTooltipTrigger);

    triggerDirective.close();
    expect(closed).not.toHaveBeenCalled();

    await user.click(trigger);
    triggerDirective.open();
    triggerDirective.close();
    fixture.detectChanges();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(closed).toHaveBeenCalledOnce();
  });

  it('does not create an overlay until opened and disposes it on destroy', async () => {
    const { user, fixture, closed, trigger } = await setup();
    const container = TestBed.inject(OverlayContainer).getContainerElement();

    expect(container.querySelector('.cdk-overlay-pane')).toBeNull();

    await user.click(trigger);

    expect(container.querySelector('.cdk-overlay-pane')).not.toBeNull();

    fixture.destroy();

    expect(container.querySelector('.cdk-overlay-pane')).toBeNull();
    expect(closed).not.toHaveBeenCalled();
  });

  it('supports a panel shared by two triggers', async () => {
    const user = userEvent.setup();
    await render(
      `
        <ang-rich-tooltip #tip tagline="Shared" />
        <button type="button" [angRichTooltipTriggerFor]="tip">First</button>
        <button type="button" [angRichTooltipTriggerFor]="tip">Second</button>
      `,
      { imports: IMPORTS },
    );
    const first = screen.getByRole('button', { name: 'First' });
    const second = screen.getByRole('button', { name: 'Second' });

    await user.click(first);

    expect(screen.getByRole('dialog', { name: 'Shared' })).toBeInTheDocument();

    await user.click(second);

    expect(screen.getAllByRole('dialog', { name: 'Shared' })).toHaveLength(1);
    expect(first).toHaveAttribute('aria-expanded', 'false');
    expect(second).toHaveAttribute('aria-expanded', 'true');

    await user.click(second);
    await user.click(first);

    expect(screen.getByRole('dialog', { name: 'Shared' })).toBeInTheDocument();
    expect(first).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes when the panel input changes while open', async () => {
    const user = userEvent.setup();
    const closed = vi.fn();
    const { rerender } = await render(
      `
        <ang-rich-tooltip #first tagline="First panel" />
        <ang-rich-tooltip #second tagline="Second panel" />
        <button type="button" [angRichTooltipTriggerFor]="useSecond ? second : first" (closed)="closed()">Open</button>
      `,
      { imports: IMPORTS, componentProperties: { useSecond: false, closed } },
    );
    const trigger = screen.getByRole('button', { name: 'Open' });

    await user.click(trigger);
    await rerender({ componentProperties: { useSecond: true, closed }, partialUpdate: true });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(closed).toHaveBeenCalledOnce();

    await user.click(trigger);

    expect(screen.getByRole('dialog', { name: 'Second panel' })).toBeInTheDocument();
  });

  it('repositions the open panel when the positions change', async () => {
    const user = userEvent.setup();
    const updatePositionSpy = vi.spyOn(OverlayRef.prototype, 'updatePosition');
    const below = [{ originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top' }];
    const above = [{ originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom' }];
    const { rerender } = await render(
      `
        <ang-rich-tooltip #tip tagline="Title" />
        <button type="button" [angRichTooltipTriggerFor]="tip" [angRichTooltipPositions]="positions">Open</button>
      `,
      { imports: IMPORTS, componentProperties: { positions: below } },
    );

    await rerender({ componentProperties: { positions: above }, partialUpdate: true });

    expect(updatePositionSpy).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Open' }));
    updatePositionSpy.mockClear();
    await rerender({ componentProperties: { positions: below }, partialUpdate: true });

    expect(updatePositionSpy).toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Title' })).toBeInTheDocument();
    updatePositionSpy.mockRestore();
  });
});
