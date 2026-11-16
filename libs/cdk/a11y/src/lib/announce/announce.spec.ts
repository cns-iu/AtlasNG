import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, signal, type Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render } from '@testing-library/angular';
import { Announce } from './announce';
import { provideAnnounceConfig } from './config';

@Component({
  imports: [Announce],
  template: `
    <span
      [angAnnounce]="text()"
      [angAnnounceDelay]="delay()"
      [angAnnouncePoliteness]="politeness()"
      [angAnnounceDisabled]="disabled()"
    >
      {{ text() }}
    </span>
  `,
})
class Host {
  readonly text = signal('5 of 120');
  readonly delay = signal<number | undefined>(undefined);
  readonly politeness = signal<'polite' | 'assertive' | undefined>(undefined);
  readonly disabled = signal(false);
}

describe('Announce', () => {
  async function setup(providers: Provider[] = []) {
    vi.useFakeTimers();
    const { fixture } = await render(Host, { providers });
    const announce = vi.spyOn(TestBed.inject(LiveAnnouncer), 'announce').mockResolvedValue();
    const host = fixture.componentInstance;
    const update = (change: () => void) => {
      change();
      fixture.detectChanges();
    };

    return { host, announce, update };
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not announce the initial text', async () => {
    const { announce } = await setup();

    vi.advanceTimersByTime(2000);

    expect(announce).not.toHaveBeenCalled();
  });

  it('announces the text once it stops changing', async () => {
    const { host, announce, update } = await setup();

    update(() => host.text.set('6 of 120'));
    vi.advanceTimersByTime(500);
    update(() => host.text.set('7 of 120'));
    vi.advanceTimersByTime(500);

    expect(announce).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);

    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith('7 of 120', undefined, undefined);
  });

  it('does not announce a text that changed back before the delay', async () => {
    const { host, announce, update } = await setup();

    update(() => host.text.set('6 of 120'));
    update(() => host.text.set('5 of 120'));
    vi.advanceTimersByTime(2000);

    expect(announce).not.toHaveBeenCalled();
  });

  it('does not announce empty texts', async () => {
    const { host, announce, update } = await setup();

    update(() => host.text.set(''));
    vi.advanceTimersByTime(2000);

    expect(announce).not.toHaveBeenCalled();
  });

  it('uses the provided config', async () => {
    const { host, announce, update } = await setup([
      provideAnnounceConfig({ delay: 100, politeness: 'assertive', duration: 3000 }),
    ]);

    update(() => host.text.set('6 of 120'));
    vi.advanceTimersByTime(100);

    expect(announce).toHaveBeenCalledWith('6 of 120', 'assertive', 3000);
  });

  it('prefers the inputs over the provided config', async () => {
    const { host, announce, update } = await setup([provideAnnounceConfig({ delay: 100, politeness: 'assertive' })]);

    update(() => {
      host.delay.set(0);
      host.politeness.set('polite');
      host.text.set('6 of 120');
    });
    vi.advanceTimersByTime(0);

    expect(announce).toHaveBeenCalledWith('6 of 120', 'polite', undefined);
  });

  it('does not announce while disabled or the text current when it is enabled again', async () => {
    const { host, announce, update } = await setup();

    update(() => {
      host.disabled.set(true);
      host.text.set('6 of 120');
    });
    vi.advanceTimersByTime(2000);
    update(() => host.disabled.set(false));
    vi.advanceTimersByTime(2000);

    expect(announce).not.toHaveBeenCalled();
  });
});
