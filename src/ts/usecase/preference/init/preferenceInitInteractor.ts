import Preference, {
  InitialPreference,
} from '@/domain/entity/preference/preference';
import Version from '@/domain/entity/preference/version';
import PreferenceRepository from '@/domain/repository/preferenceRepository';
import LogService from '@/domain/service/logService';
import { compareVersion } from '@/helper';
import InputPort from '@/usecase/core/inputPort';
import OutputPort from '@/usecase/core/outputPort';
import PreferenceInitInputData from '@/usecase/preference/init/preferenceInitInputData';
import PreferenceInitOutputData from '@/usecase/preference/init/preferenceInitOutputData';

export default class PreferenceInitInteractor
  implements InputPort<PreferenceInitInputData>
{
  constructor(
    private readonly outputPort: OutputPort<PreferenceInitOutputData> | null,
    private readonly storagePreferenceRepository: PreferenceRepository,
    private readonly logger: LogService,
    private readonly localStoragePreferenceRepository?: PreferenceRepository,
  ) {}

  async execute(data: PreferenceInitInputData) {
    if (!this.localStoragePreferenceRepository) {
      return;
    }

    const spref = await this.storagePreferenceRepository.get();

    this.logger.debug('Start PreferenceInitInteractor.execute', spref);

    if (
      compareVersion(spref.version.value, InitialPreference.version.value) === 0
    ) {
      // データ無し
      this.logger.debug(
        'Version compare -> equal',
        spref.version.value,
        InitialPreference.version.value,
        compareVersion(spref.version.value, InitialPreference.version.value),
      );

      // ローカルから移植
      // 一部、または全てのフィールドで存在しないものは初期値が入って返される
      const lpref = await this.localStoragePreferenceRepository.get();

      this.logger.debug('Local storage data', lpref);

      await this.storagePreferenceRepository.set(
        Preference.of({
          clickPosition: lpref.clickPosition,
          disabledDirectory: lpref.disabledDirectory,
          disabledDomain: lpref.disabledDomain,
          disabledOn: lpref.disabledOn,
          disabledPage: lpref.disabledPage,
          disabledSameDomain: lpref.disabledSameDomain,
          enabledBackgroundOpen: lpref.enabledBackgroundOpen,
          enabledExtension: lpref.enabledExtension,
          enabledMulticlickClose: lpref.enabledMulticlickClose,
          noCloseFixedTab: lpref.noCloseFixedTab,
          shortcutKeyToggleEnabled: lpref.shortcutKeyToggleEnabled,
          version: Version.of(data.version),
          visibleLinkState: lpref.visibleLinkState,
        }),
      );
    } else if (compareVersion(spref.version.value, data.version) !== 0) {
      // バージョン違い
      this.logger.debug(
        'Version compare -> not 0',
        spref.version.value,
        data.version,
        compareVersion(spref.version.value, data.version),
      );

      // バージョンのみ上書き保存
      await this.storagePreferenceRepository.set(
        Preference.of({
          clickPosition: spref.clickPosition,
          disabledDirectory: spref.disabledDirectory,
          disabledDomain: spref.disabledDomain,
          disabledOn: spref.disabledOn,
          disabledPage: spref.disabledPage,
          disabledSameDomain: spref.disabledSameDomain,
          enabledBackgroundOpen: spref.enabledBackgroundOpen,
          enabledExtension: spref.enabledExtension,
          enabledMulticlickClose: spref.enabledMulticlickClose,
          noCloseFixedTab: spref.noCloseFixedTab,
          shortcutKeyToggleEnabled: spref.shortcutKeyToggleEnabled,
          version: Version.of(data.version),
          visibleLinkState: spref.visibleLinkState,
        }),
      );
    }

    this.logger.debug(
      'Finish PreferenceInitInteractor.execute',
      await this.storagePreferenceRepository.get(),
    );

    this.outputPort?.execute({});
  }
}
