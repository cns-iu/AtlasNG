import { render, screen } from '@testing-library/angular';
import { KgExplorer } from './kg-explorer';

describe('KgExplorer', () => {
  it('renders the explorer placeholder', async () => {
    await render(KgExplorer);

    expect(screen.getByText('KG Explorer works!')).toBeInTheDocument();
  });
});
