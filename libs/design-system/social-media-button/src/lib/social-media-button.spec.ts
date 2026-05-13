import { provideHttpClient } from '@angular/common/http';
import { render, screen } from '@testing-library/angular';
import { SOCIAL_IDS } from './social-media';
import { SocialMediaButton } from './social-media-button';

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
