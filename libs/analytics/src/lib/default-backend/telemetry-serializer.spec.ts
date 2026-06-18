import { HttpErrorResponse } from '@angular/common/http';
import { parse } from 'qs';
import { serializeTelemetryData, serializeTelemetryValue } from './telemetry-serializer';

describe('telemetry serializer', () => {
  it('should serialize telemetry data to a query string with dot notation and indexed arrays', () => {
    const query = serializeTelemetryData({
      context: {
        app: 'AtlasNG',
        startedAt: new Date('2026-01-01T10:00:00.000Z'),
      },
      items: ['a', 'b'],
      optional: null,
    });

    const parsed = parse(query, { allowDots: true }) as {
      context: { app: string; startedAt: string };
      items: string[];
      optional?: unknown;
    };

    expect(parsed).toEqual({
      context: {
        app: 'AtlasNG',
        startedAt: '2026-01-01T10:00:00.000Z',
      },
      items: ['a', 'b'],
    });
    expect(parsed.optional).toBeUndefined();
  });

  it('should keep primitive values and arrays unchanged', () => {
    expect(serializeTelemetryValue('value')).toBe('value');
    expect(serializeTelemetryValue(12)).toBe(12);
    expect(serializeTelemetryValue(null)).toBeNull();
    expect(serializeTelemetryValue([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('should serialize Date, Map and Set values', () => {
    const date = new Date('2026-02-02T00:00:00.000Z');
    const map = new Map<string, number>([
      ['alpha', 1],
      ['beta', 2],
    ]);
    const set = new Set<string>(['a', 'b']);

    expect(serializeTelemetryValue(date)).toBe('2026-02-02T00:00:00.000Z');
    expect(serializeTelemetryValue(map)).toEqual({
      map: [
        ['alpha', 1],
        ['beta', 2],
      ],
    });
    expect(serializeTelemetryValue(set)).toEqual({
      set: ['a', 'b'],
    });
  });

  it('should serialize KeyboardEvent values and drop false modifier flags', () => {
    if (typeof KeyboardEvent === 'undefined') {
      expect(true).toBe(true);
      return;
    }

    const event = new KeyboardEvent('keydown', {
      key: 'K',
      code: 'KeyK',
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      metaKey: false,
    });

    expect(serializeTelemetryValue(event)).toEqual({
      type: 'keydown',
      key: 'K',
      code: 'KeyK',
      ctrlKey: true,
    });
  });

  it('should serialize MouseEvent values and include link target attributes', () => {
    if (typeof MouseEvent === 'undefined' || typeof document === 'undefined') {
      expect(true).toBe(true);
      return;
    }

    const anchor = document.createElement('a');
    anchor.setAttribute('href', 'https://atlasng.dev/docs');
    anchor.setAttribute('target', '_blank');

    const event = new MouseEvent('click', {
      button: 0,
      buttons: 1,
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      metaKey: false,
    });

    Object.defineProperty(event, 'target', {
      value: anchor,
      configurable: true,
    });

    expect(serializeTelemetryValue(event)).toEqual({
      type: 'click',
      button: 0,
      buttons: 1,
      ctrlKey: true,
      href: 'https://atlasng.dev/docs',
      target: '_blank',
    });
  });

  it('should serialize MouseEvent values without link attributes for non-link targets', () => {
    if (typeof MouseEvent === 'undefined' || typeof document === 'undefined') {
      expect(true).toBe(true);
      return;
    }

    const target = document.createElement('div');
    const event = new MouseEvent('click', {
      button: 0,
      buttons: 1,
      altKey: true,
      ctrlKey: false,
      shiftKey: false,
      metaKey: false,
    });

    Object.defineProperty(event, 'target', {
      value: target,
      configurable: true,
    });

    expect(serializeTelemetryValue(event)).toEqual({
      type: 'click',
      button: 0,
      buttons: 1,
      altKey: true,
    });
  });

  it('should serialize ErrorEvent values recursively', () => {
    if (typeof ErrorEvent === 'undefined') {
      expect(true).toBe(true);
      return;
    }

    const originalError = new Error('Boom');
    const event = new ErrorEvent('error', {
      message: 'Unhandled error',
      filename: 'https://atlasng.dev/app.js',
      lineno: 12,
      colno: 20,
      error: originalError,
    });

    const serialized = serializeTelemetryValue(event) as {
      message: string;
      filename: string;
      lineno: number;
      colno: number;
      error: { name: string; message: string; stack?: string };
    };

    expect(serialized.message).toBe('Unhandled error');
    expect(serialized.filename).toBe('https://atlasng.dev/app.js');
    expect(serialized.lineno).toBe(12);
    expect(serialized.colno).toBe(20);
    expect(serialized.error.name).toBe('Error');
    expect(serialized.error.message).toBe('Boom');
  });

  it('should serialize generic Event values with only the type', () => {
    if (typeof Event === 'undefined') {
      expect(true).toBe(true);
      return;
    }

    const event = new Event('focus');

    expect(serializeTelemetryValue(event)).toEqual({ type: 'focus' });
  });

  it('should serialize Error and trim oversized stack traces', () => {
    const error = new Error('Something failed');
    error.stack = Array.from({ length: 250 }, (_, index) => `line-${index}`).join('\n');

    const serialized = serializeTelemetryValue(error) as {
      name: string;
      message: string;
      stack: string;
    };

    expect(serialized.name).toBe('Error');
    expect(serialized.message).toBe('Something failed');
    expect(serialized.stack.endsWith('...')).toBe(true);
    expect(serialized.stack.length).toBeLessThanOrEqual(2003);
  });

  it('should serialize Zod-like errors', () => {
    const zodLikeError = {
      name: 'ZodError' as const,
      message: 'Validation failed',
      issues: [{ path: ['email'], message: 'Invalid email' }],
      stack: 'first\nsecond',
    };

    expect(serializeTelemetryValue(zodLikeError)).toEqual({
      name: 'ZodError',
      message: 'Validation failed',
      issues: [{ path: ['email'], message: 'Invalid email' }],
      stack: 'first\nsecond',
    });
  });

  it('should serialize $ZodError values and keep undefined stack when missing', () => {
    const zodLikeError = {
      name: '$ZodError' as const,
      message: 'Validation failed',
      issues: [{ path: ['name'], message: 'Required' }],
    };

    expect(serializeTelemetryValue(zodLikeError)).toEqual({
      name: '$ZodError',
      message: 'Validation failed',
      issues: [{ path: ['name'], message: 'Required' }],
      stack: undefined,
    });
  });

  it('should not treat invalid Zod-like objects as Zod errors', () => {
    const invalidZodLike = {
      name: 'ZodError',
      message: 42,
      issues: [],
    };

    expect(serializeTelemetryValue(invalidZodLike)).toBe(invalidZodLike);
  });

  it('should serialize HttpErrorResponse values recursively', () => {
    const httpError = new HttpErrorResponse({
      status: 500,
      url: 'https://api.atlasng.dev/telemetry',
      error: new Error('Backend exploded'),
    });

    const serialized = serializeTelemetryValue(httpError) as {
      status: number;
      url: string;
      message: string;
      error: {
        name: string;
        message: string;
        stack?: string;
      };
    };

    expect(serialized.status).toBe(500);
    expect(serialized.url).toBe('https://api.atlasng.dev/telemetry');
    expect(serialized.message).toContain('Http failure response');
    expect(serialized.error.name).toBe('Error');
    expect(serialized.error.message).toBe('Backend exploded');
  });
});
