import { AngError } from './errors';
import { assertSingleFeature, Feature } from './features';

enum Kind {
  A,
  B,
  C,
}

function feature(kind: Kind): Feature<Kind> {
  return { kind, providers: [] };
}

describe('assertSingleFeature', () => {
  it('accepts at most one feature of the given kinds', () => {
    expect(() => assertSingleFeature([feature(Kind.A), feature(Kind.C)], [Kind.A, Kind.B], 1, 'one')).not.toThrow();
    expect(() => assertSingleFeature([], [Kind.A], 1, 'one')).not.toThrow();
  });

  it('throws an AngError with the code and message for more than one feature of the given kinds', () => {
    const check = () => assertSingleFeature([feature(Kind.A), feature(Kind.B)], [Kind.A, Kind.B], 42, 'only one');

    expect(check).toThrow(AngError);
    expect(check).toThrow(/only one/);
    try {
      check();
    } catch (error) {
      expect((error as AngError).code).toBe(42);
    }
  });
});
