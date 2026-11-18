import { EventEmitter } from '@angular/core';
import { CoreEvents } from '@atlasng/analytics/events';
import { debounceAttribute, payloadAttribute, triggersAttribute } from './track-event-transforms';

describe('payloadAttribute', () => {
  it('should transform an empty string into an empty payload', () => {
    expect(payloadAttribute<CoreEvents.Click>('')).toEqual({});
  });

  it('should preserve a supplied payload', () => {
    const payload = { test: 'payload' };

    expect(payloadAttribute<CoreEvents.Click>(payload)).toBe(payload);
  });
});

describe('triggersAttribute', () => {
  it('should transform an empty string into an empty record', () => {
    expect(triggersAttribute('')).toEqual({});
  });

  it('should transform a trigger name into a record', () => {
    expect(triggersAttribute('click')).toEqual({ click: true });
  });

  it('should transform a trigger array into a record', () => {
    expect(triggersAttribute(['click', 'focus', 'click'])).toEqual({ click: true, focus: true });
  });

  it('should preserve a supplied trigger record', () => {
    const triggers = { click: true as const, selectionChange: new EventEmitter() };

    expect(triggersAttribute(triggers)).toBe(triggers);
  });
});

describe('debounceAttribute', () => {
  it('should treat missing and empty values as no delay', () => {
    expect(debounceAttribute(undefined)).toBeUndefined();
    expect(debounceAttribute(null)).toBeUndefined();
    expect(debounceAttribute('')).toBeUndefined();
  });

  it('should parse numeric values', () => {
    expect(debounceAttribute(300)).toBe(300);
    expect(debounceAttribute('300')).toBe(300);
  });
});
