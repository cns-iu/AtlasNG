import { render, screen } from '@testing-library/angular';
import { Overline } from './overline';

describe('Overline', () => {
  it('renders projected text in its original case', async () => {
    await render('<ang-overline>Option 1</ang-overline>', { imports: [Overline] });

    expect(screen.getByText('Option 1')).toHaveClass('ang-overline');
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('takes the semantics of the element it is applied to', async () => {
    await render('<h3 angOverline>Processes</h3>', { imports: [Overline] });

    expect(screen.getByRole('heading', { level: 3, name: 'Processes' })).toHaveClass('ang-overline');
  });

  it('becomes part of the heading name when placed inside a heading', async () => {
    await render('<h3><span angOverline>Option 1</span> Section heading</h3>', { imports: [Overline] });

    expect(screen.getByRole('heading', { name: 'Option 1 Section heading' })).toContainElement(
      screen.getByText('Option 1'),
    );
  });

  it('renders projected inline markup', async () => {
    await render('<ang-overline>New <em>beta</em></ang-overline>', { imports: [Overline] });

    expect(screen.getByText('New', { exact: false })).toContainElement(screen.getByText('beta'));
  });
});
