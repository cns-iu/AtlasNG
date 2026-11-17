import { APP_BASE_HREF, Location, LocationStrategy, PathLocationStrategy, PlatformLocation } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MOCK_PLATFORM_LOCATION_CONFIG, MockPlatformLocation } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideLinkHandler, withRouterHandler } from '@atlasng/common';
import { render, screen } from '@testing-library/angular';
import { LastModified } from './last-modified';
import { LastModifiedDates } from './last-modified-dates';

const URL = 'last-modified.json';

const DATES = {
  '/dataset/heart': new Date(2026, 5, 16, 12).getTime(),
  '/dataset/liver': '2026-03-15',
  '/dataset/broken': 'not a date',
};

describe('LastModifiedDates', () => {
  async function setup(path: string, template = '<ang-last-modified />', baseHref = '/') {
    const result = await render(template, {
      imports: [LastModified],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PlatformLocation, useClass: MockPlatformLocation },
        { provide: MOCK_PLATFORM_LOCATION_CONFIG, useValue: { startUrl: `http://localhost${path}` } },
        { provide: APP_BASE_HREF, useValue: baseHref },
        { provide: LocationStrategy, useClass: PathLocationStrategy },
        { provide: Location, useClass: Location },
        provideRouter([{ path: '**', children: [] }]),
        provideLinkHandler(withRouterHandler()),
      ],
    });
    return {
      ...result,
      dates: TestBed.inject(LastModifiedDates),
      http: TestBed.inject(HttpTestingController),
      location: TestBed.inject(Location),
    };
  }

  async function load(path: string, body: object | string | null = DATES, template?: string) {
    const context = await setup(path, template);
    const loaded = context.dates.loadFromUrl(URL);
    context.http.expectOne(URL).flush(body);
    await loaded;
    return context;
  }

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it("shows the current route's date from a loaded file", async () => {
    await load('/dataset/heart');

    expect(await screen.findByRole('paragraph')).toHaveTextContent('Last updated on June 16, 2026');
  });

  it('follows navigation to other routes', async () => {
    const { location } = await load('/dataset/heart');
    await screen.findByText('June 16, 2026');

    location.go('/dataset/liver');

    expect(await screen.findByText('March 15, 2026')).toBeInTheDocument();
  });

  it('follows matrix parameter changes', async () => {
    const { dates, location } = await load('/dataset/heart');
    dates.set('/dataset/heart;v=2', new Date(2026, 0, 2));
    await screen.findByText('June 16, 2026');

    location.go('/dataset/heart;v=2');

    expect(await screen.findByText('January 2, 2026')).toBeInTheDocument();
  });

  it('resolves routes relative to the base href', async () => {
    const { dates } = await setup('/app/dataset/heart', undefined, '/app');

    dates.set('/dataset/heart', new Date(2026, 5, 16));

    expect(await screen.findByText('June 16, 2026')).toBeInTheDocument();
  });

  it('ignores the query, fragment, and trailing slash', async () => {
    await load('/dataset/heart/?tab=files#top');

    expect(await screen.findByText('June 16, 2026')).toBeInTheDocument();
  });

  it('prefers the date input over the route date', async () => {
    await load('/dataset/heart', DATES, '<ang-last-modified date="2026-01-02" />');

    expect(await screen.findByText('January 2, 2026')).toBeInTheDocument();
    expect(screen.queryByText('June 16, 2026')).not.toBeInTheDocument();
  });

  it.each(['/about', '/dataset/broken'])('hides the component when %s has no valid date', async (path) => {
    const { fixture } = await load(path);
    await fixture.whenStable();

    expect(screen.queryByText(/Last updated on/)).not.toBeInTheDocument();
  });

  it.each([null, 'text'])('ignores a file whose body is %j', async (body) => {
    const { dates } = await load('/dataset/heart', body);

    expect(dates.get('/dataset/heart')).toBeUndefined();
  });

  it('rejects when the file fails to load and keeps the component hidden', async () => {
    const { dates, http, fixture } = await setup('/dataset/heart');

    const loaded = dates.loadFromUrl(URL);
    http.expectOne(URL).flush('Not found', { status: 404, statusText: 'Not Found' });

    await expect(loaded).rejects.toThrow();
    await fixture.whenStable();
    expect(screen.queryByText(/Last updated on/)).not.toBeInTheDocument();
  });

  it('merges loaded dates into the existing dates', async () => {
    const { dates, http } = await setup('/');
    const about = new Date(2026, 0, 1);
    dates.set('/about', about);

    const loaded = dates.loadFromUrl(URL);
    http.expectOne(URL).flush({ '/dataset/heart': DATES['/dataset/heart'] });
    await loaded;

    expect(dates.get('/about')).toBe(about);
    expect(dates.get('/dataset/heart')).toEqual(new Date(DATES['/dataset/heart']));
  });

  it('sets and gets dates by normalized route', async () => {
    const { dates } = await setup('/');
    const date = new Date(2026, 5, 16);

    dates.set('about/', date);

    expect(dates.get('/about?tab=1')).toBe(date);
    expect(dates.get('/team')).toBeUndefined();
  });

  it('shows a date set for the current route', async () => {
    const { dates } = await setup('/about');

    dates.set('/about', new Date(2026, 5, 16));

    expect(await screen.findByText('June 16, 2026')).toBeInTheDocument();
  });

  it('rejects invalid dates', async () => {
    const { dates } = await setup('/');

    expect(() => dates.set('/about', new Date(Number.NaN))).toThrowErrorMatchingInlineSnapshot(
      `[AngError: ANG4004: Invalid last modified date for route /about.]`,
    );
  });
});
