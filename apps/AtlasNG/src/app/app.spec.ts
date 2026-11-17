import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import { App } from './app';
import { SHOWCASE_PAGES } from './app.routes';

describe('App', () => {
  it('links to the home page and every showcase page', async () => {
    await render(App, { providers: [provideRouter([])] });

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    for (const page of SHOWCASE_PAGES) {
      expect(screen.getByRole('link', { name: page.title })).toHaveAttribute('href', `/${page.path}`);
    }
  });
});
