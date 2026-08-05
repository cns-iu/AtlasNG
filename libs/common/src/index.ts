export { AnyLink } from './lib/any-link/any-link';
export { AnyLinkActive, type AnyLinkActiveClassList, type AnyLinkActiveOptions } from './lib/any-link/any-link-active';
export { commandAttribute, isAnyLinkCommand, type AnyLinkCommand } from './lib/any-link/any-link-command';
export { IdGenerator, provideIdGeneratorConfig, type IdGeneratorConfig } from './lib/id-generator';
export {
  LinkHandler,
  type LinkAttributes,
  type LinkCommand,
  type NullableLinkAttributes,
  type PreparedLink,
} from './lib/link-handler/handler';
export {
  provideLinkHandler,
  withCustomHandler,
  withRouterHandler,
  withRouterlessHandler,
  type LinkHandlerFeature,
} from './lib/link-handler/providers';
export { RouterLinkHandler, type RouterPreparedLink } from './lib/link-handler/router-handler';
export { RouterlessLinkHandler, type RouterlessPreparedLink } from './lib/link-handler/routerless-handler';
