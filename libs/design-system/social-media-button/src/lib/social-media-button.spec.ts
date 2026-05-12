import { provideHttpClient } from '@angular/common/http';
import { render, screen } from '@testing-library/angular';
import { SocialMediaButton } from './social-media-button';
import { SOCIAL_IDS } from './static-data/parsed';

describe('SocialMediaButton', () => {
  const providers = [provideHttpClient()];

  it('it should render the social media button', async () => {
    await render(SocialMediaButton, {
      providers,
      inputs: {
        id: SOCIAL_IDS[0],
      },
    });
    const link = screen.getByRole('link');
    const icon = link.querySelector('a');
    if (icon) {
      expect(icon.getAttribute('href')).toBe('https://www.linkedin.com/company/cns-indiana-university-bloomington');
    }
  });
});
