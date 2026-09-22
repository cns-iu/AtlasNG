import { render } from '@testing-library/angular';
import { ErrorPage } from './error-page';

describe('ErrorPage', () => {
  it('should render', async () => {
    const promise = render(ErrorPage, {});
    await expect(promise).resolves.toBeTruthy();
  });
});
