import { render } from '@testing-library/angular';
import { KgExplorerMetadataModel } from './metadata-model';

const modelViewerLoaded = vi.hoisted(() => vi.fn());

vi.mock('@google/model-viewer', () => {
  modelViewerLoaded();
  return {};
});

describe('KgExplorerMetadataModel', () => {
  async function setup() {
    return render(KgExplorerMetadataModel, {
      inputs: { src: 'kidney.glb', alt: '3D model of the kidney' },
    });
  }

  it('renders a model viewer with the source, alt text, and camera controls', async () => {
    const { container } = await setup();
    // `model-viewer` is a custom element without an ARIA role, so there is no Testing Library query for it.
    const viewer = container.querySelector('model-viewer');

    expect(viewer).toHaveAttribute('src', 'kidney.glb');
    expect(viewer).toHaveAttribute('alt', '3D model of the kidney');
    expect(viewer).toHaveAttribute('camera-controls');
  });

  it('loads the model viewer web component', async () => {
    await setup();

    expect(modelViewerLoaded).toHaveBeenCalled();
  });
});
