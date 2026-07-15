import {
  Component,
  createEnvironmentInjector,
  DestroyRef,
  EnvironmentInjector,
  inject,
  runInInjectionContext,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StyleLoader } from './style-loader';

function createStyleLoaderComponent() {
  @Component({
    selector: 'ang-first-style-loader',
    template: '',
  })
  class StyleLoaderComponent {
    static readonly constructorCb = vi.fn();
    static readonly destroyCb = vi.fn();

    constructor() {
      StyleLoaderComponent.constructorCb();
      inject(DestroyRef).onDestroy(() => {
        StyleLoaderComponent.destroyCb();
      });
    }
  }

  return StyleLoaderComponent;
}

describe('StyleLoader', () => {
  const FirstStyleLoaderComponent = createStyleLoaderComponent();
  const SecondStyleLoaderComponent = createStyleLoaderComponent();

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StyleLoader],
    });

    vi.resetAllMocks();
  });

  it('loads a stylesheet component only once per loader type', () => {
    const service = TestBed.inject(StyleLoader);

    service.load(FirstStyleLoaderComponent);
    service.load(FirstStyleLoaderComponent);

    expect(FirstStyleLoaderComponent.constructorCb).toHaveBeenCalledTimes(1);
  });

  it('creates component refs for different loader types', () => {
    const service = TestBed.inject(StyleLoader);

    service.load(FirstStyleLoaderComponent);
    service.load(SecondStyleLoaderComponent);

    expect(FirstStyleLoaderComponent.constructorCb).toHaveBeenCalledTimes(1);
    expect(SecondStyleLoaderComponent.constructorCb).toHaveBeenCalledTimes(1);
  });

  it('destroys created refs when its injection context is destroyed', () => {
    const parentInjector = TestBed.inject(EnvironmentInjector);
    const childInjector = createEnvironmentInjector([], parentInjector);
    const service = runInInjectionContext(childInjector, () => new StyleLoader());

    service.load(FirstStyleLoaderComponent);

    childInjector.destroy();

    expect(FirstStyleLoaderComponent.destroyCb).toHaveBeenCalledTimes(1);
  });
});
