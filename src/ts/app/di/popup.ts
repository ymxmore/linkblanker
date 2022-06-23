import { Browser } from 'webextension-polyfill';
import inject from '@/app/di/inject';
import PreferenceRepository from '@/domain/repository/preferenceRepository';
import LocalStoragePreferenceRepository from '@/interface/gateway/browser/repository/localStoragePreferenceRepository';
import TabGetView from '@/interface/view/tab/tabGetView';
import TabListView from '@/interface/view/tab/tabListView';

export default (
  browser: Browser,
  tabGetView: TabGetView,
  tabListView: TabListView,
) => {
  const container = inject(browser);

  container.register<PreferenceRepository>('LocalStoragePreferenceRepository', {
    useFactory: () => new LocalStoragePreferenceRepository(localStorage),
  });

  container.register<TabGetView>('TabGetView', {
    useValue: tabGetView,
  });

  container.register<TabListView>('TabListView', {
    useValue: tabListView,
  });

  return container;
};
