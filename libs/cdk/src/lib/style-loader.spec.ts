import {
  Component,
  ComponentRef,
  createEnvironmentInjector,
  EnvironmentInjector,
  runInInjectionContext,
  Type,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StyleLoader } from './style-loader';

@Component({
  selector: 'ang-first-style-loader',
  template: '',
})
class FirstStyleLoaderComponent {}

@Component({
  selector: 'ang-second-style-loader',
  template: '',
})
class SecondStyleLoaderComponent {}

describe('StyleLoader', () => {
  function getRefs(service: StyleLoader): ComponentRef<unknown>[] {
    return (service as unknown as { refs: ComponentRef<unknown>[] }).refs;
  }

  function getLoaders(service: StyleLoader): Set<Type<unknown>> {
    return (service as unknown as { loaders: Set<Type<unknown>> }).loaders;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StyleLoader],
    });
  });

  it('loads a stylesheet component only once per loader type', () => {
    const service = TestBed.inject(StyleLoader);

    service.load(FirstStyleLoaderComponent);
    service.load(FirstStyleLoaderComponent);

    expect(getLoaders(service).has(FirstStyleLoaderComponent)).toBe(true);
    expect(getRefs(service)).toHaveLength(1);
  });

  it('creates component refs for different loader types', () => {
    const service = TestBed.inject(StyleLoader);

    service.load(FirstStyleLoaderComponent);
    service.load(SecondStyleLoaderComponent);

    expect(getLoaders(service).has(FirstStyleLoaderComponent)).toBe(true);
    expect(getLoaders(service).has(SecondStyleLoaderComponent)).toBe(true);
    expect(getRefs(service)).toHaveLength(2);
  });

  it('destroys created refs when its injection context is destroyed', () => {
    const parentInjector = TestBed.inject(EnvironmentInjector);
    const childInjector = createEnvironmentInjector([], parentInjector);
    const service = runInInjectionContext(childInjector, () => new StyleLoader());

    service.load(FirstStyleLoaderComponent);

    const [firstRef] = getRefs(service);
    const destroySpy = vi.spyOn(firstRef, 'destroy');

    childInjector.destroy();

    expect(destroySpy).toHaveBeenCalledTimes(1);
  });
});
