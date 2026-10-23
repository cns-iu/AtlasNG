import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { RichTooltip, RichTooltipAction } from './rich-tooltip';
import { RichTooltipClose } from './rich-tooltip-close';
import { RichTooltipTrigger } from './rich-tooltip-trigger';

describe('RichTooltipClose', () => {
  it('closes the tooltip and restores focus to the trigger', async () => {
    const user = userEvent.setup();
    const closed = vi.fn();
    await render(
      `
        <ang-rich-tooltip #tip tagline="Title" (closed)="closed()">
          <button type="button" angRichTooltipAction angRichTooltipClose>Dismiss</button>
        </ang-rich-tooltip>
        <button type="button" [angRichTooltipTriggerFor]="tip">Open</button>
      `,
      {
        imports: [RichTooltip, RichTooltipAction, RichTooltipClose, RichTooltipTrigger],
        componentProperties: { closed },
      },
    );

    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(closed).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus();
  });
});
