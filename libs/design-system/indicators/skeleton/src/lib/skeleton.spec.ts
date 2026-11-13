import { render } from '@testing-library/angular';
import { Skeleton, SkeletonShape } from './skeleton';

describe('Skeleton', () => {
  it('defaults to one line of text that is hidden from assistive technology', async () => {
    const { fixture } = await render(Skeleton);
    const host: HTMLElement = fixture.nativeElement;

    expect(host).toHaveClass('ang-skeleton', 'ang-skeleton--shape-text');
    expect(host).toHaveAttribute('aria-hidden', 'true');
    expect(host.children).toHaveLength(1);
  });

  it.each<SkeletonShape>(['text', 'circle', 'rect'])('applies the %s shape class', async (shape) => {
    const { fixture } = await render(Skeleton, { inputs: { shape } });

    expect(fixture.nativeElement).toHaveClass('ang-skeleton', `ang-skeleton--shape-${shape}`);
  });

  it('stacks one placeholder per text line', async () => {
    const { fixture } = await render('<ang-skeleton lines="3" />', { imports: [Skeleton] });
    const host: HTMLElement = fixture.debugElement.children[0].nativeElement;

    expect(host.children).toHaveLength(3);
  });

  it.each([0, -2, Number.NaN])('renders a single line when lines is %s', async (lines) => {
    const { fixture } = await render(Skeleton, { inputs: { lines } });

    expect(fixture.nativeElement.children).toHaveLength(1);
  });

  it.each<SkeletonShape>(['circle', 'rect'])('ignores lines for the %s shape', async (shape) => {
    const { fixture } = await render(Skeleton, { inputs: { shape, lines: 3 } });

    expect(fixture.nativeElement.children).toHaveLength(1);
  });
});
