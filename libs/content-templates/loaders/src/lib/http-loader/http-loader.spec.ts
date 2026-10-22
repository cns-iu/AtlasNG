import { inject } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Observable } from 'rxjs';
import { DATA_LOADERS, DataLoaderRegistry, DataLoaderContext } from '../data-loader-registry';
import { ContentValidationError } from '@atlasng/content-templates/utils';
import { HttpDataLoader, HttpDataLoaderConfig } from './http-loader';

const context: DataLoaderContext = {
  node: { component: 'test' },
  path: 'content',
  key: 'rows',
  signal: new AbortController().signal,
};

async function setup(): Promise<{ loader: HttpDataLoader; controller: HttpTestingController }> {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: DATA_LOADERS, useValue: { http: () => inject(HttpDataLoader) }, multi: true },
      DataLoaderRegistry,
    ],
  });
  const loader = (await TestBed.inject(DataLoaderRegistry).get('http')) as HttpDataLoader;
  return { loader, controller: TestBed.inject(HttpTestingController) };
}

describe('HttpDataLoader', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('fetches json by default', async () => {
    const { loader, controller } = await setup();

    const result = firstValueFrom(loader.load({ url: '/data.json' }, context));
    const request = controller.expectOne('/data.json');
    request.flush({ value: 1 });

    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('json');
    await expect(result).resolves.toEqual({ value: 1 });
  });

  it.each<[NonNullable<HttpDataLoaderConfig['responseType']>, unknown]>([
    ['json', [1, 2]],
    ['text', 'a,b\n1,2'],
    ['blob', new Blob(['blob'])],
    ['arraybuffer', new ArrayBuffer(4)],
  ])('fetches with responseType %s', async (responseType, body) => {
    const { loader, controller } = await setup();

    const result = firstValueFrom(loader.load({ url: '/data', responseType }, context));
    const request = controller.expectOne('/data');
    request.flush(body as never);

    expect(request.request.responseType).toBe(responseType);
    await expect(result).resolves.toEqual(body);
  });

  it('rejects configs without a string url or with an unsupported responseType', async () => {
    const { loader } = await setup();
    const config = { url: 1, responseType: 'xml' } as unknown as HttpDataLoaderConfig;

    expect(() => loader.load(config, context)).toThrow(
      "Invalid content at 'content': data.rows.url: Expected a string `url`.; data.rows.responseType: Expected " +
        "`responseType` to be one of 'json', 'text', 'blob', 'arraybuffer'.",
    );
    expect(() => loader.load(config, context)).toThrow(ContentValidationError);
  });

  it('cancels the request on unsubscribe', async () => {
    const { loader, controller } = await setup();

    const subscription = (loader.load({ url: '/slow' }, context) as Observable<unknown>).subscribe();
    const request = controller.expectOne('/slow');
    subscription.unsubscribe();

    expect(request.cancelled).toBe(true);
  });
});
