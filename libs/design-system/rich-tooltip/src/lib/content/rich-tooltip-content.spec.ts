import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import {
  RichTooltipActionsComponent,
  RichTooltipCloseDirective,
  RichTooltipContainerComponent,
  RichTooltipContentComponent,
  RichTooltipTaglineComponent,
} from './rich-tooltip-content';
import { RichTooltipDirective } from '../rich-tooltip.directive';

const RICH_TOOLTIP_IMPORTS = [
  RichTooltipDirective,
  RichTooltipContainerComponent,
  RichTooltipTaglineComponent,
  RichTooltipContentComponent,
  RichTooltipActionsComponent,
  RichTooltipCloseDirective,
];

describe('RichTooltipContainerComponent', () => {
  it('renders the default content and emits when its action is selected', async () => {
    const actionClick = vi.fn();
    const user = userEvent.setup();

    await render(
      `
				<button
					type="button"
					angRichTooltip
					angRichTooltipTagline="Tooltip title"
					angRichTooltipDescription="Tooltip description"
					angRichTooltipActionText="Continue"
					(angRichTooltipActionClick)="actionClick()"
				>
					Open tooltip
				</button>
			`,
      {
        imports: RICH_TOOLTIP_IMPORTS,
        componentProperties: { actionClick },
      },
    );

    await user.click(screen.getByRole('button', { name: 'Open tooltip' }));

    expect(screen.getByText('Tooltip title')).toBeVisible();
    expect(screen.getByText('Tooltip description')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(actionClick).toHaveBeenCalledOnce();
  });

  it('renders projected content and closes when a custom close action is selected', async () => {
    const user = userEvent.setup();

    await render(
      `
				<ang-rich-tooltip-container #content>
					<ang-rich-tooltip-tagline>Custom title</ang-rich-tooltip-tagline>
					<ang-rich-tooltip-content>Custom description</ang-rich-tooltip-content>
					<ang-rich-tooltip-actions>
						<button type="button" angRichTooltipClose>Dismiss tooltip</button>
					</ang-rich-tooltip-actions>
				</ang-rich-tooltip-container>
				<button type="button" [angRichTooltip]="content">Open custom tooltip</button>
			`,
      { imports: RICH_TOOLTIP_IMPORTS },
    );

    await user.click(screen.getByRole('button', { name: 'Open custom tooltip' }));

    expect(screen.getByText('Custom title')).toBeVisible();
    expect(screen.getByText('Custom description')).toBeVisible();
    expect(screen.queryByText('Tooltip title')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Dismiss tooltip' }));

    expect(screen.queryByText('Custom description')).not.toBeInTheDocument();
  });
});
