import { Component, inject } from '@angular/core';
import { render } from '@testing-library/angular';
import { EVENT_SCOPE, EventScope, provideEventScope } from './scope';

describe('EventScope', () => {
  @Component({
    selector: 'ang-event-scope-sink',
    template: '',
  })
  class EventScopeSink {
    readonly scope = inject(EVENT_SCOPE);
  }

  @Component({
    selector: 'ang-component-with-scope',
    template: '<ng-content />',
    providers: [provideEventScope('comp')],
  })
  class ComponentWithScope {}

  async function setup(template: string) {
    const result = await render(template, {
      imports: [EventScope, ComponentWithScope, EventScopeSink],
    });
    const sinkEl = result.debugElement.query((el) => el.componentInstance instanceof EventScopeSink);
    return { ...result, sink: sinkEl?.componentInstance as EventScopeSink | undefined };
  }

  it('should create a scope with the provided name', async () => {
    const { sink } = await setup('<div angEventScope="test"><ang-event-scope-sink /></div>');
    expect(sink?.scope.name()).toBe('test');
  });

  it('should build the correct scope path', async () => {
    const { sink } = await setup(
      `<div angEventScope="outer">
        <div angEventScope="inner">
          <ang-event-scope-sink />
        </div>
      </div>`,
    );
    expect(sink?.scope.path()).toMatch(/outer\.inner$/);
  });

  it('should resolve the correct parent scope', async () => {
    const { sink } = await setup(
      `<ang-component-with-scope>
        <div angEventScope="child">
          <ang-event-scope-sink />
        </div>
      </ang-component-with-scope>`,
    );
    expect(sink?.scope.path()).toMatch(/comp\.child$/);
  });

  it('should handle multiple scopes on the same element', async () => {
    const { sink } = await setup(
      `<ang-component-with-scope angEventScope="test">
        <ang-event-scope-sink />
      </ang-component-with-scope>`,
    );
    expect(sink?.scope.path()).toMatch(/test.comp$/);
  });
});
