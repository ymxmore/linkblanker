import 'reflect-metadata';
import { container } from 'tsyringe';
import { Browser, Storage } from 'webextension-polyfill';
import PreferenceRepository from '@/domain/repository/preferenceRepository';
import TabBundleRepository from '@/domain/repository/tabBundleRepository';
import I18nService from '@/domain/service/i18nService';
import LogService, { LOG_LEVEL } from '@/domain/service/logService';
import PreferenceService from '@/domain/service/preferenceService';
import TabService from '@/domain/service/tabService';
import PreferenceController from '@/interface/controller/preferenceController';
import TabBundleController from '@/interface/controller/tabBundleController';
import TabController from '@/interface/controller/tabController';
import BrowserPreferenceRepository from '@/interface/gateway/browser/repository/browserPreferenceRepository';
import BrowserTabBundleRepository from '@/interface/gateway/browser/repository/browserTabBundleRepository';
import BrowserI18nService from '@/interface/gateway/browser/service/browserI18nService';
import BrowserLogService from '@/interface/gateway/browser/service/browserLogService';
import BrowserTabService from '@/interface/gateway/browser/service/browserTabService';
import PreferenceGetPresenter from '@/interface/presenter/preference/preferenceGetPresenter';
import PreferenceSetPresenter from '@/interface/presenter/preference/preferenceSetPresenter';
import TabClosePresenter from '@/interface/presenter/tab/tabClosePresenter';
import TabGetPresenter from '@/interface/presenter/tab/tabGetPresenter';
import TabListPresenter from '@/interface/presenter/tab/tabListPresenter';
import TabSyncPresenter from '@/interface/presenter/tab/tabSyncPresenter';
import TabBundleDeletePresenter from '@/interface/presenter/tabBundle/tabBundleDeletePresenter';
import TabBundleListPresenter from '@/interface/presenter/tabBundle/tabBundleListPresenter';
import TabBundleUndoPresenter from '@/interface/presenter/tabBundle/tabBundleUndoPresenter';
import AppPreferenceService from '@/interface/service/appPreferenceService';
import PreferenceGetView from '@/interface/view/preference/preferenceGetView';
import PreferenceSetView from '@/interface/view/preference/preferenceSetView';
import TabCloseView from '@/interface/view/tab/tabCloseView';
import TabGetView from '@/interface/view/tab/tabGetView';
import TabListView from '@/interface/view/tab/tabListView';
import TabSyncView from '@/interface/view/tab/tabSyncView';
import TabBundleDeleteView from '@/interface/view/tabBundle/tabBundleDeleteView';
import TabBundleListView from '@/interface/view/tabBundle/tabBundleListView';
import TabBundleUndoView from '@/interface/view/tabBundle/tabBundleUndoView';
import InputPort from '@/usecase/core/inputPort';
import OutputPort from '@/usecase/core/outputPort';
import PreferenceGetInputData from '@/usecase/preference/get/preferenceGetInputData';
import PreferenceGetInteractor from '@/usecase/preference/get/preferenceGetInteractor';
import PreferenceGetOutputData from '@/usecase/preference/get/preferenceGetOutputData';
import PreferenceInitInputData from '@/usecase/preference/init/preferenceInitInputData';
import PreferenceInitInteractor from '@/usecase/preference/init/preferenceInitInteractor';
import PreferenceInitOutputData from '@/usecase/preference/init/preferenceInitOutputData';
import PreferenceSetInputData from '@/usecase/preference/set/preferenceSetInputData';
import PreferenceSetInteractor from '@/usecase/preference/set/preferenceSetInteractor';
import PreferenceSetOutputData from '@/usecase/preference/set/preferenceSetOutputData';
import TabCloseInputData from '@/usecase/tab/close/tabCloseInputData';
import TabCloseInteractor from '@/usecase/tab/close/tabCloseInteractor';
import TabCloseOutputData from '@/usecase/tab/close/tabCloseOutputData';
import TabGetInputData from '@/usecase/tab/get/tabGetInputData';
import TabGetInteractor from '@/usecase/tab/get/tabGetInteractor';
import TabGetOutputData from '@/usecase/tab/get/tabGetOutputData';
import TabListInputData from '@/usecase/tab/list/tabListInputData';
import TabListInteractor from '@/usecase/tab/list/tabListInteractor';
import TabListOutputData from '@/usecase/tab/list/tabListOutputData';
import TabOpenInputData from '@/usecase/tab/open/tabOpenInputData';
import TabOpenInteractor from '@/usecase/tab/open/tabOpenInteractor';
import TabOpenOutputData from '@/usecase/tab/open/tabOpenOutputData';
import TabSyncInputData from '@/usecase/tab/sync/tabSyncInputData';
import TabSyncInteractor from '@/usecase/tab/sync/tabSyncInteractor';
import TabSyncOutputData from '@/usecase/tab/sync/tabSyncOutputData';
import TabBundleCleanInputData from '@/usecase/tabBundle/clean/tabBundleCleanInputData';
import TabBundleCleanInteractor from '@/usecase/tabBundle/clean/tabBundleCleanInteractor';
import TabBundleCleanOutputData from '@/usecase/tabBundle/clean/tabBundleCleanOutputData';
import TabBundleDeleteInputData from '@/usecase/tabBundle/delete/tabBundleDeleteInputData';
import TabBundleDeleteInteractor from '@/usecase/tabBundle/delete/tabBundleDeleteInteractor';
import TabBundleDeleteOutputData from '@/usecase/tabBundle/delete/tabBundleDeleteOutputData';
import TabBundleListInputData from '@/usecase/tabBundle/list/tabBundleListInputData';
import TabBundleListInteractor from '@/usecase/tabBundle/list/tabBundleListInteractor';
import TabBundleListOutputData from '@/usecase/tabBundle/list/tabBundleListOutputData';
import TabBundleUndoInputData from '@/usecase/tabBundle/undo/tabBundleUndoInputData';
import TabBundleUndoInteractor from '@/usecase/tabBundle/undo/tabBundleUndoInteractor';
import TabBundleUndoOutputData from '@/usecase/tabBundle/undo/tabBundleUndoOutputData';

export default (browser: Browser) => {
  container.register<Browser>('Browser', {
    useValue: browser,
  });

  container.register<LogService>('LogService', {
    useFactory: () =>
      new BrowserLogService(
        console,
        process.env.NODE_ENV === 'production'
          ? LOG_LEVEL.ERROR
          : LOG_LEVEL.DEBUG,
      ),
  });

  container.register<Storage.Static>('Storage.Static', {
    useFactory: (c) => c.resolve<Browser>('Browser').storage,
  });

  container.register<Storage.LocalStorageArea>('Storage.LocalStorageArea', {
    useFactory: (c) => c.resolve<Storage.Static>('Storage.Static').local,
  });

  container.register<Storage.SyncStorageAreaSync>(
    'Storage.SyncStorageAreaSync',
    {
      useFactory: (c) => c.resolve<Storage.Static>('Storage.Static').sync,
    },
  );

  container.register<PreferenceRepository>('BrowserPreferenceRepository', {
    useFactory: (c) =>
      new BrowserPreferenceRepository(
        c.resolve<Storage.SyncStorageAreaSync>('Storage.SyncStorageAreaSync'),
      ),
  });

  container.register<TabBundleRepository>('TabBundleRepository', {
    useFactory: (c) =>
      new BrowserTabBundleRepository(
        c.resolve<Storage.LocalStorageArea>('Storage.LocalStorageArea'),
        c.resolve<LogService>('LogService'),
      ),
  });

  container.register<TabService>('TabService', {
    useFactory: () => new BrowserTabService(browser),
  });

  container.register<I18nService>('I18nService', {
    useFactory: () => new BrowserI18nService(browser),
  });

  container.register<PreferenceService>('PreferenceService', {
    useClass: PreferenceService,
  });

  container.register<AppPreferenceService>('AppPreferenceService', {
    useFactory: (c) =>
      new AppPreferenceService(
        c.resolve<PreferenceService>('PreferenceService'),
      ),
  });

  container.register<OutputPort<PreferenceGetOutputData>>(
    'PreferenceGetPresenter',
    {
      useFactory: (c) =>
        new PreferenceGetPresenter(
          c.isRegistered('PreferenceGetView')
            ? c.resolveAll<PreferenceGetView>('PreferenceGetView')
            : [],
        ),
    },
  );

  container.register<OutputPort<PreferenceSetOutputData>>(
    'PreferenceSetPresenter',
    {
      useFactory: (c) =>
        new PreferenceSetPresenter(
          c.isRegistered('PreferenceSetView')
            ? c.resolveAll<PreferenceSetView>('PreferenceSetView')
            : [],
        ),
    },
  );

  container.register<OutputPort<TabCloseOutputData>>('TabClosePresenter', {
    useFactory: (c) =>
      new TabClosePresenter(
        c.isRegistered('TabCloseView')
          ? c.resolveAll<TabCloseView>('TabCloseView')
          : [],
      ),
  });

  container.register<OutputPort<TabGetOutputData>>('TabGetPresenter', {
    useFactory: (c) =>
      new TabGetPresenter(
        c.isRegistered('TabGetView')
          ? c.resolveAll<TabGetView>('TabGetView')
          : [],
      ),
  });

  container.register<OutputPort<TabSyncOutputData>>('TabSyncPresenter', {
    useFactory: (c) =>
      new TabSyncPresenter(
        c.isRegistered('TabSyncView')
          ? c.resolveAll<TabSyncView>('TabSyncView')
          : [],
      ),
  });

  container.register<OutputPort<TabListOutputData>>('TabListPresenter', {
    useFactory: (c) =>
      new TabListPresenter(
        c.isRegistered('TabListView')
          ? c.resolveAll<TabListView>('TabListView')
          : [],
      ),
  });

  container.register<OutputPort<TabBundleListOutputData>>(
    'TabBundleListPresenter',
    {
      useFactory: (c) =>
        new TabBundleListPresenter(
          c.isRegistered('TabBundleListView')
            ? c.resolveAll<TabBundleListView>('TabBundleListView')
            : [],
        ),
    },
  );

  container.register<OutputPort<TabBundleDeleteOutputData>>(
    'TabBundleDeletePresenter',
    {
      useFactory: (c) =>
        new TabBundleDeletePresenter(
          c.isRegistered('TabBundleDeleteView')
            ? c.resolveAll<TabBundleDeleteView>('TabBundleDeleteView')
            : [],
        ),
    },
  );

  container.register<OutputPort<TabBundleUndoOutputData>>(
    'TabBundleUndoPresenter',
    {
      useFactory: (c) =>
        new TabBundleUndoPresenter(
          c.isRegistered('TabBundleUndoView')
            ? c.resolveAll<TabBundleUndoView>('TabBundleUndoView')
            : [],
        ),
    },
  );

  container.register<InputPort<PreferenceInitInputData>>(
    'PreferenceInitInteractor',
    {
      useFactory: (c) =>
        new PreferenceInitInteractor(
          c.isRegistered('PreferenceInitPresenter')
            ? c.resolve<OutputPort<PreferenceInitOutputData>>(
                'PreferenceInitPresenter',
              )
            : null,
          c.resolve<PreferenceRepository>('BrowserPreferenceRepository'),
          c.resolve<LogService>('LogService'),
          c.isRegistered('LocalStoragePreferenceRepository')
            ? c.resolve<PreferenceRepository>(
                'LocalStoragePreferenceRepository',
              )
            : null,
        ),
    },
  );

  container.register<InputPort<PreferenceGetInputData>>(
    'PreferenceGetInteractor',
    {
      useFactory: (c) =>
        new PreferenceGetInteractor(
          c.isRegistered('PreferenceGetPresenter')
            ? c.resolve<OutputPort<PreferenceGetOutputData>>(
                'PreferenceGetPresenter',
              )
            : null,
          c.resolve<PreferenceRepository>('BrowserPreferenceRepository'),
        ),
    },
  );

  container.register<InputPort<PreferenceSetInputData>>(
    'PreferenceSetInteractor',
    {
      useFactory: (c) =>
        new PreferenceSetInteractor(
          c.isRegistered('PreferenceSetPresenter')
            ? c.resolve<OutputPort<PreferenceSetOutputData>>(
                'PreferenceSetPresenter',
              )
            : null,
          c.resolve<PreferenceRepository>('BrowserPreferenceRepository'),
          c.resolve<TabService>('TabService'),
        ),
    },
  );

  container.register<InputPort<TabCloseInputData>>('TabCloseInteractor', {
    useFactory: (c) =>
      new TabCloseInteractor(
        c.isRegistered('TabClosePresenter')
          ? c.resolve<OutputPort<TabCloseOutputData>>('TabClosePresenter')
          : null,
        c.resolve<PreferenceRepository>('BrowserPreferenceRepository'),
        c.resolve<TabBundleRepository>('TabBundleRepository'),
        c.resolve<TabService>('TabService'),
      ),
  });

  container.register<InputPort<TabGetInputData>>('TabGetInteractor', {
    useFactory: (c) =>
      new TabGetInteractor(
        c.isRegistered('TabGetPresenter')
          ? c.resolve<OutputPort<TabGetOutputData>>('TabGetPresenter')
          : null,
        c.resolve<PreferenceRepository>('BrowserPreferenceRepository'),
        c.resolve<TabService>('TabService'),
      ),
  });

  container.register<InputPort<TabSyncInputData>>('TabSyncInteractor', {
    useFactory: (c) =>
      new TabSyncInteractor(
        c.isRegistered('TabSyncPresenter')
          ? c.resolve<OutputPort<TabSyncOutputData>>('TabSyncPresenter')
          : null,
        c.resolve<PreferenceRepository>('BrowserPreferenceRepository'),
        c.resolve<PreferenceService>('PreferenceService'),
        c.resolve<TabService>('TabService'),
      ),
  });

  container.register<InputPort<TabListInputData>>('TabListInteractor', {
    useFactory: (c) =>
      new TabListInteractor(
        c.isRegistered('TabListPresenter')
          ? c.resolve<OutputPort<TabListOutputData>>('TabListPresenter')
          : null,
        c.resolve<TabService>('TabService'),
      ),
  });

  container.register<InputPort<TabOpenInputData>>('TabOpenInteractor', {
    useFactory: (c) =>
      new TabOpenInteractor(
        c.isRegistered('TabOpenPresenter')
          ? c.resolve<OutputPort<TabOpenOutputData>>('TabOpenPresenter')
          : null,
        c.resolve<PreferenceRepository>('BrowserPreferenceRepository'),
        c.resolve<TabService>('TabService'),
      ),
  });

  container.register<InputPort<TabBundleListInputData>>(
    'TabBundleListInteractor',
    {
      useFactory: (c) =>
        new TabBundleListInteractor(
          c.isRegistered('TabBundleListPresenter')
            ? c.resolve<OutputPort<TabBundleListOutputData>>(
                'TabBundleListPresenter',
              )
            : null,
          c.resolve<TabBundleRepository>('TabBundleRepository'),
        ),
    },
  );

  container.register<InputPort<TabBundleDeleteInputData>>(
    'TabBundleDeleteInteractor',
    {
      useFactory: (c) =>
        new TabBundleDeleteInteractor(
          c.isRegistered('TabBundleDeletePresenter')
            ? c.resolve<OutputPort<TabBundleDeleteOutputData>>(
                'TabBundleDeletePresenter',
              )
            : null,
          c.resolve<TabBundleRepository>('TabBundleRepository'),
        ),
    },
  );

  container.register<InputPort<TabBundleUndoInputData>>(
    'TabBundleUndoInteractor',
    {
      useFactory: (c) =>
        new TabBundleUndoInteractor(
          c.isRegistered('TabBundleUndoPresenter')
            ? c.resolve<OutputPort<TabBundleUndoOutputData>>(
                'TabBundleUndoPresenter',
              )
            : null,
          c.resolve<TabBundleRepository>('TabBundleRepository'),
          c.resolve<TabService>('TabService'),
        ),
    },
  );

  container.register<InputPort<TabBundleCleanInputData>>(
    'TabBundleCleanInteractor',
    {
      useFactory: (c) =>
        new TabBundleCleanInteractor(
          c.isRegistered('TabBundleCleanPresenter')
            ? c.resolve<OutputPort<TabBundleCleanOutputData>>(
                'TabBundleCleanPresenter',
              )
            : null,
          c.resolve<TabBundleRepository>('TabBundleRepository'),
        ),
    },
  );

  container.register<PreferenceController>('PreferenceController', {
    useFactory: (c) =>
      new PreferenceController(
        c.resolve<InputPort<PreferenceInitInputData>>(
          'PreferenceInitInteractor',
        ),
        c.resolve<InputPort<PreferenceGetInputData>>('PreferenceGetInteractor'),
        c.resolve<InputPort<PreferenceSetInputData>>('PreferenceSetInteractor'),
      ),
  });

  container.register<TabController>('TabController', {
    useFactory: (c) =>
      new TabController(
        c.resolve<InputPort<TabCloseInputData>>('TabCloseInteractor'),
        c.resolve<InputPort<TabGetInputData>>('TabGetInteractor'),
        c.resolve<InputPort<TabOpenInputData>>('TabOpenInteractor'),
        c.resolve<InputPort<TabSyncInputData>>('TabSyncInteractor'),
        c.resolve<InputPort<TabListInputData>>('TabListInteractor'),
      ),
  });

  container.register<TabBundleController>('TabBundleController', {
    useFactory: (c) =>
      new TabBundleController(
        c.resolve<InputPort<TabBundleListInputData>>('TabBundleListInteractor'),
        c.resolve<InputPort<TabBundleDeleteInputData>>(
          'TabBundleDeleteInteractor',
        ),
        c.resolve<InputPort<TabBundleUndoInputData>>('TabBundleUndoInteractor'),
        c.resolve<InputPort<TabBundleCleanInputData>>(
          'TabBundleCleanInteractor',
        ),
      ),
  });

  return container;
};
