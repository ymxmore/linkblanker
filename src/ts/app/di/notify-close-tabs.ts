import { Browser } from 'webextension-polyfill';
import inject from '@/app/di/inject';
import TabBundleDeleteView from '@/interface/view/tabBundle/tabBundleDeleteView';
import TabBundleListView from '@/interface/view/tabBundle/tabBundleListView';
import TabBundleUndoView from '@/interface/view/tabBundle/tabBundleUndoView';

export default (
  browser: Browser,
  tabBundleListView: TabBundleListView,
  tabBundleDeleteView: TabBundleDeleteView,
  tabBundleUndoView: TabBundleUndoView,
) => {
  const container = inject(browser);

  container.register<TabBundleListView>('TabBundleListView', {
    useValue: tabBundleListView,
  });

  container.register<TabBundleDeleteView>('TabBundleDeleteView', {
    useValue: tabBundleDeleteView,
  });

  container.register<TabBundleUndoView>('TabBundleUndoView', {
    useValue: tabBundleUndoView,
  });

  return container;
};
