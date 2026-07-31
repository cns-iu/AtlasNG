import { ElementRef, inject, Renderer2 } from '@angular/core';
import { ITrackEventHandler } from './track-event-handler';

/** Reconciles DOM listeners for a track-event handler. */
export class TrackEventListenerManager {
  /** The host element on which trigger listeners are registered. */
  readonly #element = inject(ElementRef).nativeElement as Element;
  /** The renderer used to register DOM event listeners. */
  readonly #renderer = inject(Renderer2);
  /** Registered trigger names mapped to their listener cleanup functions. */
  readonly #listeners = new Map<string, () => void>();
  /** The handler that supplies a listener for each trigger. */
  readonly #handler: ITrackEventHandler;

  /**
   * Creates a track-event listener manager.
   *
   * @param handler The handler used for trigger listeners.
   */
  constructor(handler: ITrackEventHandler) {
    this.#handler = handler;
  }

  /**
   * Adds listeners for triggers that are not currently registered.
   *
   * @param triggers The triggers that should have listeners.
   */
  addListeners(triggers: Set<string>): void {
    for (const trigger of triggers) {
      if (!this.#listeners.has(trigger)) {
        const handler = this.#handler.getHandler(trigger);
        const unlisten = this.#renderer.listen(this.#element, trigger, handler);
        this.#listeners.set(trigger, unlisten);
      }
    }
  }

  /**
   * Removes registered listeners that are not in the retained trigger set.
   *
   * @param keep The triggers whose listeners should be retained.
   */
  removeListeners(keep?: Set<string>): void {
    for (const [trigger, unlisten] of this.#listeners) {
      if (!keep?.has(trigger)) {
        unlisten();
        this.#listeners.delete(trigger);
      }
    }
  }

  /**
   * Reconciles registered listeners with a trigger set.
   *
   * @param triggers The triggers that should have listeners.
   */
  updateListeners(triggers: Set<string>): void {
    this.removeListeners(triggers);
    this.addListeners(triggers);
  }

  /** Removes every registered listener after active events finish processing. */
  destroy(): void {
    setTimeout(() => this.removeListeners());
  }
}
