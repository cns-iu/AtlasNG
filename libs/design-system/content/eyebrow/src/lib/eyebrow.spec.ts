import { render, screen } from '@testing-library/angular';
import { Eyebrow } from './eyebrow';

describe('Eyebrow', () => {
  it('renders projected text in its original case', async () => {
    await render('<ang-eyebrow>Option 1</ang-eyebrow>', { imports: [Eyebrow] });

    expect(screen.getByText('Option 1')).toHaveClass('ang-eyebrow');
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('takes the semantics of the element it is applied to', async () => {
    await render('<h3 angEyebrow>Processes</h3>', { imports: [Eyebrow] });

    expect(screen.getByRole('heading', { level: 3, name: 'Processes' })).toHaveClass('ang-eyebrow');
  });

  it('becomes part of the heading name when placed inside a heading', async () => {
    await render('<h3><span angEyebrow>Option 1</span> Section heading</h3>', { imports: [Eyebrow] });

    expect(screen.getByRole('heading', { name: 'Option 1 Section heading' })).toContainElement(
      screen.getByText('Option 1'),
    );
  });

  it('renders projected inline markup', async () => {
    await render('<ang-eyebrow>New <em>beta</em></ang-eyebrow>', { imports: [Eyebrow] });

    expect(screen.getByText('New', { exact: false })).toContainElement(screen.getByText('beta'));
  });
});
