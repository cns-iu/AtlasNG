import { render, screen } from '@testing-library/angular';
import { ContentParagraph } from './content-paragraph';

describe('ContentParagraph', () => {
  it('renders projected content inside a paragraph', async () => {
    await render('<ang-content-paragraph>Paragraph text</ang-content-paragraph>', {
      imports: [ContentParagraph],
    });

    expect(screen.getByRole('paragraph')).toHaveTextContent('Paragraph text');
  });

  it('renders projected inline markup inside the paragraph', async () => {
    await render('<ang-content-paragraph>Some <strong>bold</strong> text</ang-content-paragraph>', {
      imports: [ContentParagraph],
    });

    expect(screen.getByRole('paragraph')).toContainElement(screen.getByText('bold'));
  });
});
