import { CoreEvents } from '@atlasng/analytics/events';
import { payloadAttribute, triggersAttribute } from './track-event-transforms';

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
  it('should transform an empty string into an empty array', () => {
    expect(triggersAttribute('')).toEqual([]);
  });

  it('should transform a trigger name into an array', () => {
    expect(triggersAttribute('click')).toEqual(['click']);
  });

  it('should preserve a supplied trigger array without removing duplicates', () => {
    const triggers = ['click', 'click'];

    expect(triggersAttribute(triggers)).toBe(triggers);
  });
});
