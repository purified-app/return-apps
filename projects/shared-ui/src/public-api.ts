/*
 * Public API Surface of shared-ui
 */

export { appBaseUrl } from './lib/core/app-base-url';
export { reloadOnChunkLoadError } from './lib/core/reload-on-chunk-error';
export { parseFlag } from './lib/core/parse-flag';
export {
  LEVEL_MODES,
  ORIENT_MODES,
  applyInclineTare,
  cardinalLabel,
  compassHeadingFromEvent,
  formatForMode,
  inclineFromPitchRoll,
  isWithinLevelThreshold,
  levelDeviation,
  modeTitle,
  normalizeHeading,
  parseLevelMode,
  parseOrientMode,
  parseThreshold,
  roundOrient,
  sampleFromDeviceOrientation,
  valueForMode,
  withInclineTare,
  type LevelMode,
  type OrientMode,
  type OrientationSample,
} from './lib/core/orientation-math';
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
export {
  detectReturnAppsLang,
  provideReturnI18n,
  type ReturnAppsLang,
} from './lib/i18n/provide-return-i18n';

export { RbDemoCaller } from './lib/ui/demo-caller';
export { RbHomeDocs } from './lib/ui/home-docs';
export { RbLangSwitch } from './lib/ui/lang-switch';
export { RbMetaList } from './lib/ui/meta-list';
export { RbPanel } from './lib/ui/panel';
export { RbPage, type RbPageVariant } from './lib/ui/page';
export { RbResultActions } from './lib/ui/result-actions';
