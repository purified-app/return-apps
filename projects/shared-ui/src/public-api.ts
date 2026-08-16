/*
 * Public API Surface of shared-ui
 */

export { appBaseUrl } from './lib/core/app-base-url';
export { reloadOnChunkLoadError } from './lib/core/reload-on-chunk-error';
export {
  RETURN_CONTRACT_VERSION,
  buildDemoOpenUrl,
  buildOpenUrl,
  readReturnParams,
  type ReturnResult,
} from './lib/core/return-helpers';
export {
  ReturnUrlValidator,
  type ReturnDelivery,
  type ReturnRedirectParams,
  type ReturnUrlValidation,
  type ValidateReturnUrlOptions,
} from './lib/core/return-url.validator';
export {
  copyText,
  downloadBlob,
  downloadDataUrl,
  downloadText,
  svgDataUrlToPngBlob,
  type ResultDownload,
} from './lib/core/result-actions';

export { RbDemoCaller } from './lib/ui/demo-caller';
export { RbHomeDocs } from './lib/ui/home-docs';
export { RbMetaList } from './lib/ui/meta-list';
export { RbPanel } from './lib/ui/panel';
export { RbPage, type RbPageVariant } from './lib/ui/page';
export { RbResultActions } from './lib/ui/result-actions';
