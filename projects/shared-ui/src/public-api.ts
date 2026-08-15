/*
 * Public API Surface of shared-ui
 */

export { appBaseUrl } from './lib/core/app-base-url';
export { reloadOnChunkLoadError } from './lib/core/reload-on-chunk-error';
export {
  ReturnUrlValidator,
  readReturnParams,
  type ReturnDelivery,
  type ReturnRedirectParams,
  type ReturnUrlValidation,
  type ValidateReturnUrlOptions,
} from './lib/core/return-url.validator';

export { RbMetaList } from './lib/ui/meta-list';
export { RbPanel } from './lib/ui/panel';
export { RbPage, type RbPageVariant } from './lib/ui/page';
