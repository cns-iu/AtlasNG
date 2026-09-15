import { render } from '@testing-library/angular';
import { ServerErrorPage } from './server-error-page';

describe('ServerErrorPage', () => {
  it('should render', async () => {
    const promise = render(ServerErrorPage, {
      inputs: {
        reportIssueLink: '/report-issue',
      },
    });
    await expect(promise).resolves.toBeTruthy();
  });
});
