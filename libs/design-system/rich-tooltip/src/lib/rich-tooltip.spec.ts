import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { RichTooltip, RichTooltipAction, RichTooltipContent, RichTooltipTagline } from './rich-tooltip';
import { RichTooltipTrigger } from './rich-tooltip-trigger';

const IMPORTS = [RichTooltip, RichTooltipTagline, RichTooltipContent, RichTooltipAction, RichTooltipTrigger];

describe('RichTooltip', () => {
  it('renders nothing in place', async () => {
    await render('<ang-rich-tooltip tagline="Title" description="Text" />', { imports: IMPORTS });

    expect(screen.queryByText('Title')).not.toBeInTheDocument();
  });

  it('renders the simple variant and emits actionClick', async () => {
    const user = userEvent.setup();
    const actionClick = vi.fn();
    await render(
      `
        <ang-rich-tooltip #tip tagline="Title" description="Description" actionText="Action" (actionClick)="actionClick()" />
        <button type="button" [angRichTooltipTriggerFor]="tip">Open</button>
      `,
      { imports: IMPORTS, componentProperties: { actionClick } },
    );

    await user.click(screen.getByRole('button', { name: 'Open' }));

    const dialog = screen.getByRole('dialog', { name: 'Title' });
    expect(dialog).toHaveClass('ang-rich-tooltip');
    expect(screen.getByText('Description')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Action' }));

    expect(actionClick).toHaveBeenCalledOnce();
  });

  it('omits empty tagline, content and actions rows', async () => {
    const user = userEvent.setup();
    await render(
      `
        <ang-rich-tooltip #tip description="Only text" />
        <button type="button" [angRichTooltipTriggerFor]="tip">Open</button>
      `,
      { imports: IMPORTS },
    );

    await user.click(screen.getByRole('button', { name: 'Open' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).not.toHaveAttribute('aria-labelledby');
    expect(dialog.querySelector('.ang-rich-tooltip--tagline-container')).toBeNull();
    expect(dialog.querySelector('.ang-rich-tooltip--actions')).toBeNull();
    expect(dialog.querySelector('.ang-rich-tooltip--content-container')).toHaveTextContent('Only text');
  });

  it('renders custom content and collects every action into the actions row', async () => {
    const user = userEvent.setup();
    await render(
      `
        <ang-rich-tooltip #tip>
          <ang-rich-tooltip-tagline>Custom title</ang-rich-tooltip-tagline>
          <ang-rich-tooltip-content>Custom description</ang-rich-tooltip-content>
          <button type="button" angRichTooltipAction>First</button>
          <ang-rich-tooltip-action><button type="button">Second</button></ang-rich-tooltip-action>
        </ang-rich-tooltip>
        <button type="button" [angRichTooltipTriggerFor]="tip">Open</button>
      `,
      { imports: IMPORTS },
    );

    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByRole('dialog', { name: 'Custom title' })).toBeInTheDocument();
    expect(screen.getByText('Custom description')).toBeVisible();

    const first = screen.getByRole('button', { name: 'First' });
    const second = screen.getByText('Second').closest('ang-rich-tooltip-action');
    expect(first).toHaveClass('ang-rich-tooltip--action');
    expect(second).toHaveClass('ang-rich-tooltip--action');
    expect(first.parentElement).toHaveClass('ang-rich-tooltip--actions');
    expect(second?.parentElement).toBe(first.parentElement);
  });

  it('emits closed when close is called', async () => {
    const { fixture } = await render(RichTooltip);
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);

    fixture.componentInstance.close();

    expect(closed).toHaveBeenCalledOnce();
  });
});
