import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Observable } from 'rxjs';
import { ContentDataLoaderRegistry } from '../registry/data-loader-registry';
import { provideContentTemplates, withDataLoaders } from '../registry/providers';
import { ContentDataContext } from '../types/content-data';
import { HttpContentDataLoader, HttpContentDataLoaderConfig } from './http-loader';

const context: ContentDataContext = { node: { component: 'test' }, signal: new AbortController().signal };

function setup(): { loader: HttpContentDataLoader; controller: HttpTestingController } {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideContentTemplates(withDataLoaders({ http: () => new HttpContentDataLoader() })),
    ],
  });
  const loader = TestBed.inject(ContentDataLoaderRegistry).get('http') as HttpContentDataLoader;
  return { loader, controller: TestBed.inject(HttpTestingController) };
}

describe('HttpContentDataLoader', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('fetches json by default', async () => {
    const { loader, controller } = setup();

    const result = firstValueFrom(loader.load({ type: 'http', url: '/data.json' }, context));
    const request = controller.expectOne('/data.json');
    request.flush({ value: 1 });

    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('json');
    await expect(result).resolves.toEqual({ value: 1 });
  });

  it.each<[NonNullable<HttpContentDataLoaderConfig['responseType']>, unknown]>([
    ['json', [1, 2]],
    ['text', 'a,b\n1,2'],
    ['blob', new Blob(['blob'])],
    ['arraybuffer', new ArrayBuffer(4)],
  ])('fetches with responseType %s', async (responseType, body) => {
    const { loader, controller } = setup();

    const result = firstValueFrom(loader.load({ type: 'http', url: '/data', responseType }, context));
    const request = controller.expectOne('/data');
    request.flush(body as never);

    expect(request.request.responseType).toBe(responseType);
    await expect(result).resolves.toEqual(body);
  });

  it('cancels the request on unsubscribe', () => {
    const { loader, controller } = setup();

    const subscription = (loader.load({ type: 'http', url: '/slow' }, context) as Observable<unknown>).subscribe();
    const request = controller.expectOne('/slow');
    subscription.unsubscribe();

    expect(request.cancelled).toBe(true);
  });
});
