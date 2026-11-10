import { ContentValidationError } from './content-validation-error';

describe('ContentValidationError', () => {
  it('formats issues with the node path', () => {
    const error = new ContentValidationError('content.@default[0]', [{ message: 'Bad.', path: ['data', 'rows', 0] }]);

    expect(error.message).toBe("ANG5005: Invalid content at 'content.@default[0]': data.rows[0]: Bad.");
    expect(error).toMatchObject({ name: 'ContentValidationError', code: 5005, path: 'content.@default[0]' });
  });

  it('formats object path segments and issues without a path', () => {
    const error = new ContentValidationError('content', [
      { message: 'Bad.', path: [{ key: 'config' }, { key: 'title' }] },
      { message: 'Also bad.' },
    ]);

    expect(error.message).toBe("ANG5005: Invalid content at 'content': config.title: Bad.; Also bad.");
  });
});
