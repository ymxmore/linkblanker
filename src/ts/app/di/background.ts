import { Browser } from 'webextension-polyfill';
import inject from '@/app/di/inject';
import TabCloseView from '@/interface/view/tab/tabCloseView';
import TabGetView from '@/interface/view/tab/tabGetView';

export default (
  browser: Browser,
  tabGetView: TabGetView,
  tabCloseView: TabCloseView,
) => {
  const container = inject(browser);

  container.register<TabGetView>('TabGetView', {
    useValue: tabGetView,
  });

  container.register<TabCloseView>('TabCloseView', {
    useValue: tabCloseView,
  });

  return container;
};
