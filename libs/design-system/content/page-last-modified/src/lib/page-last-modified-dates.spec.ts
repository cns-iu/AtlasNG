import { Location, LocationStrategy, PathLocationStrategy, PlatformLocation } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MOCK_PLATFORM_LOCATION_CONFIG, MockPlatformLocation } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import { PageLastModified } from './page-last-modified';
import { providePageLastModified } from './page-last-modified-dates';

const DATES = {
  '/dataset/heart': '2026-06-16',
  '/dataset/liver': '2026-03-15',
  '/dataset/broken': 42,
};

describe('providePageLastModified', () => {
  async function setup(path: string, template = '<ang-page-last-modified />') {
    const result = await render(template, {
      imports: [PageLastModified],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PlatformLocation, useClass: MockPlatformLocation },
        { provide: MOCK_PLATFORM_LOCATION_CONFIG, useValue: { startUrl: `http://localhost${path}` } },
        { provide: LocationStrategy, useClass: PathLocationStrategy },
        { provide: Location, useClass: Location },
        provideRouter([{ path: '**', children: [] }]),
        providePageLastModified({ url: 'page-last-modified.json' }),
      ],
    });
    TestBed.tick();
    return { ...result, http: TestBed.inject(HttpTestingController), location: TestBed.inject(Location) };
  }

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it("shows the current route's date from the dates file", async () => {
    const { http } = await setup('/dataset/heart');

    http.expectOne('page-last-modified.json').flush(DATES);

    expect(await screen.findByText('June 16, 2026')).toBeInTheDocument();
    expect(screen.getByRole('paragraph')).toHaveTextContent('Last updated on June 16, 2026');
  });

  it('follows navigation to other routes', async () => {
    const { http, location } = await setup('/dataset/heart');
    http.expectOne('page-last-modified.json').flush(DATES);
    await screen.findByText('June 16, 2026');

    location.go('/dataset/liver');

    expect(await screen.findByText('March 15, 2026')).toBeInTheDocument();
  });

  it('ignores the query, fragment, and trailing slash', async () => {
    const { http } = await setup('/dataset/heart/?tab=files#top');

    http.expectOne('page-last-modified.json').flush(DATES);

    expect(await screen.findByText('June 16, 2026')).toBeInTheDocument();
  });

  it('prefers the lastModified input over the dates file', async () => {
    const { http } = await setup('/dataset/heart', `<ang-page-last-modified lastModified="2026-01-02" />`);

    http.expectOne('page-last-modified.json').flush(DATES);

    expect(await screen.findByText('January 2, 2026')).toBeInTheDocument();
    expect(screen.queryByText('June 16, 2026')).not.toBeInTheDocument();
  });

  it.each(['/about', '/dataset/broken'])('hides itself when %s has no valid date', async (path) => {
    const { http, fixture } = await setup(path);

    http.expectOne('page-last-modified.json').flush(DATES);
    await fixture.whenStable();

    expect(screen.queryByText(/Last updated on/)).not.toBeInTheDocument();
  });

  it('hides itself when the dates file fails to load', async () => {
    const { http, fixture } = await setup('/dataset/heart');

    http.expectOne('page-last-modified.json').flush('Not found', { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();

    expect(screen.queryByText(/Last updated on/)).not.toBeInTheDocument();
  });
});
