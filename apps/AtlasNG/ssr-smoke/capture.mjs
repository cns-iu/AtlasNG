/* eslint-disable no-console -- The smoke check reports through the console and captures console output. */
/**
 * Console methods whose output fails the smoke check.
 * @type {readonly ['error', 'warn']}
 */
const FAILING_METHODS = ['error', 'warn'];

/**
 * Matches Angular hydration error codes (NG0500 to NG0599).
 */
export const HYDRATION_ERROR_PATTERN = /NG0?5\d\d/;

/**
 * A captured console message.
 * @typedef {{ level: string, message: string }} CapturedMessage
 */

/**
 * Formats console arguments as one string, keeping error stacks.
 *
 * @param {unknown[]} args Console arguments.
 * @returns {string} The formatted message.
 */
export function formatArgs(args) {
  return args
    .map((arg) => (arg instanceof Error ? (arg.stack ?? String(arg)) : typeof arg === 'string' ? arg : inspect(arg)))
    .join(' ');
}

/**
 * Converts a value to a readable string without throwing on circular structures.
 *
 * @param {unknown} value Value to convert.
 * @returns {string} The string.
 */
function inspect(value) {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

/**
 * Records every console message while keeping it out of the terminal.
 *
 * @returns {{ messages: CapturedMessage[], failures: () => CapturedMessage[], restore: () => void }}
 *   The captured messages, the ones that fail the check, and a function that restores the console.
 */
export function captureConsole() {
  /** @type {CapturedMessage[]} */
  const messages = [];
  const originals = new Map();
  for (const level of ['log', 'info', 'debug', ...FAILING_METHODS]) {
    originals.set(level, console[level]);
    console[level] = (...args) => messages.push({ level, message: formatArgs(args) });
  }

  return {
    messages,
    failures: () =>
      messages.filter(({ level, message }) => FAILING_METHODS.includes(level) || HYDRATION_ERROR_PATTERN.test(message)),
    restore: () => originals.forEach((fn, level) => (console[level] = fn)),
  };
}
