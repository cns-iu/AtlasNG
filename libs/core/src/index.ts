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
  type ConfigurationWithDefaults,
} from './lib/configuration-token';
export { SafeStorage } from './lib/utils/storage';
