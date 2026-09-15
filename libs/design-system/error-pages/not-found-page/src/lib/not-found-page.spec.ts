import { render } from '@testing-library/angular';
import { NotFoundPage } from './not-found-page';

describe('NotFoundPage', () => {
  it('should render', async () => {
    const promise = render(NotFoundPage, {});
    await expect(promise).resolves.toBeTruthy();
  });
});
