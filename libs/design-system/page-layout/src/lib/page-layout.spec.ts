import { render, screen } from '@testing-library/angular';
import { PageLayout, PageLayoutEnd, PageLayoutHeader, PageLayoutIntro, PageLayoutSidePanel } from './page-layout';

const IMPORTS = [PageLayout, PageLayoutHeader, PageLayoutIntro, PageLayoutSidePanel, PageLayoutEnd];

describe('PageLayout', () => {
  it('projects marked content into its slot and unmarked content into main', async () => {
    await render(
      `<ang-page-layout>
        <p angPageLayoutEnd>End</p>
        <p>Main</p>
        <nav aria-label="On this page" angPageLayoutSidePanel>Side panel</nav>
        <p angPageLayoutIntro>Intro</p>
        <p angPageLayoutHeader>Header</p>
      </ang-page-layout>`,
      { imports: IMPORTS },
    );

    expect(screen.getByText('Header').parentElement).toHaveClass('ang-page-layout--header');
    expect(screen.getByText('Intro').parentElement).toHaveClass('ang-page-layout--intro');
    expect(screen.getByText('Side panel').parentElement).toHaveClass('ang-page-layout--side-panel');
    expect(screen.getByText('Main').parentElement).toHaveClass('ang-page-layout--main');
    expect(screen.getByText('End').parentElement).toHaveClass('ang-page-layout--end');
  });

  it('places the side panel after the header and intro and before main content in the DOM', async () => {
    await render(
      `<ang-page-layout>
        <p>Main</p>
        <p angPageLayoutEnd>End</p>
        <p angPageLayoutSidePanel>Side panel</p>
        <p angPageLayoutIntro>Intro</p>
        <p angPageLayoutHeader>Header</p>
      </ang-page-layout>`,
      { imports: IMPORTS },
    );

    const order = ['Header', 'Intro', 'Side panel', 'Main', 'End'].map((text) => screen.getByText(text));
    for (let index = 1; index < order.length; index++) {
      expect(order[index - 1].compareDocumentPosition(order[index])).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    }
  });

  it('accepts slot elements', async () => {
    await render(
      `<ang-page-layout>
        <ang-page-layout-header>Header</ang-page-layout-header>
        <ang-page-layout-intro>Intro</ang-page-layout-intro>
        <ang-page-layout-side-panel>Side panel</ang-page-layout-side-panel>
        <ang-page-layout-end>End</ang-page-layout-end>
      </ang-page-layout>`,
      { imports: IMPORTS },
    );

    expect(screen.getByText('Header').parentElement).toHaveClass('ang-page-layout--header');
    expect(screen.getByText('Intro').parentElement).toHaveClass('ang-page-layout--intro');
    expect(screen.getByText('Side panel').parentElement).toHaveClass('ang-page-layout--side-panel');
    expect(screen.getByText('End').parentElement).toHaveClass('ang-page-layout--end');
  });

  it('adds no landmarks of its own', async () => {
    await render('<ang-page-layout><p>Main</p></ang-page-layout>', { imports: IMPORTS });

    expect(screen.queryByRole('main')).not.toBeInTheDocument();
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
  });
});
