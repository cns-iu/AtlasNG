import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { screen } from '@testing-library/angular';
import { appConfig } from '../app.config';

describe('showcase pages', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: appConfig.providers });
  });

  it.each([
    ['/', 'AtlasNG'],
    ['/design-system', 'Design system'],
    ['/labs', 'Labs'],
    ['/common', 'Common'],
    ['/cdk', 'CDK'],
    ['/content-blocks', 'Content blocks'],
  ])('renders %s', async (url, heading) => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    await harness.fixture.whenStable();

    expect(await screen.findByRole('heading', { level: 1, name: new RegExp(heading) })).toBeInTheDocument();
  });

  it('redirects unknown routes to the home page', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/unknown');

    expect(screen.getByRole('heading', { level: 1, name: 'AtlasNG' })).toBeInTheDocument();
  });
});
