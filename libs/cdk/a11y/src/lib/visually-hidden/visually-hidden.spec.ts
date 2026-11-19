import { Component } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { VisuallyHidden } from './visually-hidden';

@Component({
  imports: [VisuallyHidden],
  template: `
    <span angVisuallyHidden>First hint</span>
    <span angVisuallyHidden>Second hint</span>
  `,
})
class Host {}

describe('VisuallyHidden', () => {
  it('adds the cdk-visually-hidden class', async () => {
    await render(Host);

    expect(screen.getByText('First hint')).toHaveClass('cdk-visually-hidden');
    expect(screen.getByText('Second hint')).toHaveClass('cdk-visually-hidden');
  });

  it('hides the element visually', async () => {
    await render(Host);

    expect(screen.getByText('First hint')).toHaveStyle({ position: 'absolute', width: '1px', height: '1px' });
  });
});
