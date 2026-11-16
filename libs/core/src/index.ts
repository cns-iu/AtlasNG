export {
  CUSTOM_ELEMENT_REGISTRY,
  DOCUMENT,
  LOCAL_STORAGE,
  LOCATION,
  NAVIGATION,
  RESIZE_OBSERVER,
  SAFE_LOCAL_STORAGE,
  SAFE_SESSION_STORAGE,
  SESSION_STORAGE,
  WINDOW,
} from './lib/browser-tokens';
export {
  createConfigurationToken,
  type,
  type ConfigurationToken,
  type ConfigurationTokenOptions,
  type ConfigurationOf,
  type ConfigurationWithDefaults,
} from './lib/configuration-token';
export {
  computedMessage,
  computedText,
  getLocalizationContext,
  injectLocalizationContext,
  resolveText,
  type InjectLocalizationContextOptions,
  type LocalizationContext,
  type LocalizedMessage,
  type LocalizedText,
  type PluralForms,
} from './lib/localization';
export { SafeStorage } from './lib/utils/storage';
export { AngError, formatAngErrorCode } from './lib/errors';
