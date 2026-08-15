/*
 * Public API Surface of shared-ui
 */

export { appBaseUrl } from './lib/core/app-base-url';
export { buildDemoOpenUrl, buildOpenUrl, type BuildOpenUrlOptions } from './lib/core/build-open-url';
export { parseReturnResult, type ReturnResult } from './lib/core/parse-return-result';
export { reloadOnChunkLoadError } from './lib/core/reload-on-chunk-error';
export {
  DEFAULT_DELIVERY_BY_APP,
  RETURN_CONTRACT_VERSION,
  SENSITIVE_APPS,
  nfcFormat,
  scanFormat,
  type ReturnAppId,
  type ReturnAppsMessage,
  type ReturnDelivery,
  type ReturnErrorCode,
  type ReturnFormat,
} from './lib/core/return-contract';
export { ReturnSession, type ReturnSessionInit } from './lib/core/return-session';
export {
  ReturnUrlValidator,
  type ReturnRedirectParams,
  type ReturnUrlValidation,
  type ValidateReturnUrlOptions,
} from './lib/core/return-url.validator';

export { RbDemoCaller } from './lib/ui/demo-caller';
export { RbHomeDocs } from './lib/ui/home-docs';
export { RbMetaList } from './lib/ui/meta-list';
export { RbPanel } from './lib/ui/panel';
export { RbPage, type RbPageVariant } from './lib/ui/page';
