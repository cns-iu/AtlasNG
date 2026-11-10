import { AngError, formatAngErrorCode } from './errors';

describe('formatAngErrorCode', () => {
  it('prefixes and zero-pads the code', () => {
    expect(formatAngErrorCode(42)).toBe('ANG0042');
    expect(formatAngErrorCode(3001)).toBe('ANG3001');
  });
});

describe('AngError', () => {
  it('includes the message after the code', () => {
    const error = new AngError(3001, 'Something failed');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('AngError');
    expect(error.code).toBe(3001);
    expect(error.message).toBe('ANG3001: Something failed');
  });

  it.each<string | false | null | undefined>([undefined, null, false, ''])(
    'uses only the code when the message is %o',
    (message) => {
      expect(new AngError(3001, message).message).toBe('ANG3001');
    },
  );
});
