import InputData from '@/usecase/core/inputData';

export const Keys = [
  'clickPositionLeft',
  'clickPositionMiddle',
  'clickPositionRight',
  'disabledDirectory',
  'disabledDomain',
  'disabledOn',
  'disabledPage',
  'disabledSameDomain',
  'enabledBackgroundOpen',
  'enabledExtension',
  'enabledMulticlickClose',
  'noCloseFixedTab',
  'shortcutKeyToggleEnabled',
  'version',
  'visibleLinkState',
] as const;

export type Key = typeof Keys[number];
export type Value = boolean | string;

export default interface PreferenceSetInputData extends InputData {
  readonly preference: Record<Key, Value>;
}
