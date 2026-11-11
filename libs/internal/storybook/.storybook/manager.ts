import { GLOBALS_UPDATED, SET_GLOBALS, UPDATE_GLOBALS } from 'storybook/internal/core-events';
import { addons } from 'storybook/manager-api';

/** Toolbar globals, such as the selected theme and background. */
type Globals = Record<string, unknown>;

/** Context Storybook binds to channel listeners; `refId` is set when a composed ref sent the event. */
interface ChannelEventContext {
  /** Id of the ref that sent the event, or undefined for the local preview. */
  refId?: string;
}

/** Attribute Storybook sets on a preview iframe once it loads; the channel only targets iframes that have it. */
const LOADED_ATTRIBUTE = 'data-is-loaded';

/**
 * Finds the iframe that renders a composed ref. Storybook creates it the first time a story from that ref is opened.
 *
 * @param refId - Id of the composed ref.
 * @returns The ref's iframe, or null if the ref hasn't been opened.
 */
function getRefFrame(refId: string): HTMLIFrameElement | null {
  const frame = document.getElementById(`storybook-ref-${refId}`);
  return frame instanceof HTMLIFrameElement ? frame : null;
}

/**
 * Sends globals to a composed ref's iframe if it has loaded.
 * An unloaded target makes the channel fall back to the active iframe, which can be the local preview and would
 * echo the update back, so unloaded refs are skipped and synced by {@link whenRefLoaded} instead.
 *
 * @param refId - Id of the composed ref.
 * @param globals - Globals to apply in the ref.
 */
function sendToRef(refId: string, globals: Globals): void {
  const frame = getRefFrame(refId);
  if (frame?.hasAttribute(LOADED_ATTRIBUTE)) {
    addons.getChannel().emit(UPDATE_GLOBALS, { globals, options: { target: frame.id } });
  }
}

/**
 * Runs a callback once a composed ref's iframe has loaded.
 *
 * @param refId - Id of the composed ref.
 * @param callback - Called when the iframe is loaded.
 */
function whenRefLoaded(refId: string, callback: () => void): void {
  const frame = getRefFrame(refId);
  if (frame?.hasAttribute(LOADED_ATTRIBUTE)) {
    callback();
  } else {
    // Defer so Storybook's own load handler sets the loaded attribute first.
    frame?.addEventListener('load', () => setTimeout(callback), { once: true });
  }
}

/**
 * Forwards toolbar globals to composed refs. Storybook only sends them to the local preview
 * (storybookjs/storybook#15805), so themes and backgrounds picked in the composition would not reach library stories.
 *
 * @see https://github.com/cns-iu/AtlasNG/issues/301
 */
addons.register('atlasng/ref-globals', (api) => {
  const channel = addons.getChannel();

  /**
   * Sends globals to every composed ref that has loaded.
   *
   * @param globals - Globals to apply in the refs.
   */
  const forwardToRefs = (globals: Globals): void => {
    for (const refId of Object.keys(api.getRefs())) {
      sendToRef(refId, globals);
    }
  };

  channel.on(SET_GLOBALS, function (this: ChannelEventContext, { globals }: { globals: Globals }) {
    const { refId } = this;
    if (refId) {
      // A ref started with its own defaults, so send it the composition's current globals.
      whenRefLoaded(refId, () => sendToRef(refId, api.getUserGlobals()));
    } else {
      forwardToRefs(globals);
    }
  });

  channel.on(GLOBALS_UPDATED, function (this: ChannelEventContext, { userGlobals }: { userGlobals: Globals }) {
    if (!this.refId) {
      forwardToRefs(userGlobals);
    }
  });
});
