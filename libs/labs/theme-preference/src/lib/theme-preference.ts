/** Theme preference choices exposed to users. */
export type ThemePreference = 'light' | 'dark' | 'system';

/** Concrete color schemes that can be applied to the document. */
export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

/**
 * Determines whether an unknown value is a supported theme preference.
 *
 * @param value Value to validate.
 * @returns Whether the value is a supported theme preference.
 */
export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}
