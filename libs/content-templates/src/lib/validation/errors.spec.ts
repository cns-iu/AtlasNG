import { checkUnknownKeys, ContentValidationError, reportRecoverableIssues } from './errors';

describe('ContentValidationError', () => {
  it('formats issues with the node path', () => {
    const error = new ContentValidationError('content.@default[0]', [{ message: 'Bad.', path: ['data', 'rows', 0] }]);

    expect(error.message).toBe("Invalid content at 'content.@default[0]': data.rows[0]: Bad.");
  });
});

describe('checkUnknownKeys', () => {
  it('reports keys missing from the declared record', () => {
    expect(checkUnknownKeys('card', 'data', ['rows', 'extra'], { rows: 1 })).toEqual([
      { message: "Unknown data key 'extra'.", path: ['data', 'extra'] },
    ]);
  });

  it('reports the whole property when nothing is declared', () => {
    expect(checkUnknownKeys('card', 'data', ['rows'], undefined)).toEqual([
      { message: "Component 'card' does not accept data.", path: ['data'] },
    ]);
    expect(checkUnknownKeys('card', 'data', [], undefined)).toEqual([]);
  });
});

describe('reportRecoverableIssues', () => {
  const issues = [{ message: "Unknown data key 'x'.", path: ['data', 'x'] }];

  it('does nothing without issues', () => {
    expect(() => reportRecoverableIssues('content', [])).not.toThrow();
  });

  it('throws in dev mode', () => {
    expect(() => reportRecoverableIssues('content', issues)).toThrow(ContentValidationError);
  });

  it('warns in prod mode', () => {
    const global = globalThis as Record<string, unknown>;
    const original = global['ngDevMode'];
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    global['ngDevMode'] = false;
    try {
      reportRecoverableIssues('content', issues);
      expect(warn).toHaveBeenCalledWith("Invalid content at 'content': data.x: Unknown data key 'x'.");
    } finally {
      global['ngDevMode'] = original;
      warn.mockRestore();
    }
  });
});
