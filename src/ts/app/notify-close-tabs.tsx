import '../../sass/notify-close-tabs.scss';
import { cyan, grey, blueGrey, common } from '@mui/material/colors';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import browser from 'webextension-polyfill';
import { ACTION, MINIMUM_TAB_BUNDLE_TIME } from '@/app/constants';
import inject from '@/app/di/notify-close-tabs';
import I18nService from '@/domain/service/i18nService';
import LogService from '@/domain/service/logService';
import { getCurrentTime } from '@/helper';
import TabBundleController from '@/interface/controller/tabBundleController';
import TabBundleDeleteView from '@/interface/view/tabBundle/tabBundleDeleteView';
import TabBundleListView from '@/interface/view/tabBundle/tabBundleListView';
import TabBundleUndoView from '@/interface/view/tabBundle/tabBundleUndoView';
import { DIRECTION } from '@/interface/viewmodel/tab/tabCloseViewModel';
import TabBundleDeleteViewModel from '@/interface/viewmodel/tabBundle/tabBundleDeleteViewModel';
import TabBundleListViewModel from '@/interface/viewmodel/tabBundle/tabBundleListViewModel';
import TabBundleUndoViewModel from '@/interface/viewmodel/tabBundle/tabBundleUndoViewModel';

const theme = createTheme({
  palette: {
    primary: {
      light: cyan[300],
      main: cyan[500],
      dark: cyan[700],
      contrastText: common.white,
    },
    secondary: {
      light: cyan[300],
      main: cyan[500],
      dark: cyan[700],
      contrastText: blueGrey[900],
    },
    text: {
      primary: grey[800],
      secondary: grey[700],
      disabled: grey[400],
    },
  },
});

const tabBundleListSubscribers: React.Dispatch<
  React.SetStateAction<TabBundleListViewModel>
>[] = [];

const tabBundleListView: TabBundleListView = (data: TabBundleListViewModel) => {
  logger.debug('tabBundleListView', data);
  tabBundleListSubscribers.forEach((f) => f(data));
};

const tabBundleDeleteView: TabBundleDeleteView = (
  data: TabBundleDeleteViewModel,
) => {
  logger.debug('tabBundleDeleteView', data);
};

const tabBundleUndoView: TabBundleUndoView = (data: TabBundleUndoViewModel) => {
  logger.debug('tabBundleUndoView', data);
};

const container = inject(
  browser,
  tabBundleListView,
  tabBundleDeleteView,
  tabBundleUndoView,
);

const logger = container.resolve<LogService>('LogService');

const tabBundleController = container.resolve<TabBundleController>(
  'TabBundleController',
);
const i18n = container.resolve<I18nService>('I18nService');
const extId = i18n.get('@@extension_id');
const icon = `chrome-extension://${extId}/img/icon-enabled.svg`;

interface Props {
  id: number;
}

const App = (props: Props) => {
  const [vm, setTabBundleListViewModel] = useState<TabBundleListViewModel>();
  const [className, setClassName] = useState<{ [name: number]: string }>({});
  const [timeoutId, setTimeoutId] = useState<{
    [name: number]: NodeJS.Timeout;
  }>({});

  const fetch = () => {
    const time = getCurrentTime() - MINIMUM_TAB_BUNDLE_TIME;
    tabBundleController.clean(time);
    tabBundleController.list(props.id, time);
  };

  const messageListener = (message) => {
    switch (message?.action) {
      case ACTION.NOTIFY_CLOSE_TABS:
        if (!message?.data?.from || message.data.from !== props.id) {
          // 対象のタブではない場合は処理終了
          break;
        }

        // データのロード
        fetch();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    tabBundleListSubscribers.push(setTabBundleListViewModel);
    browser.runtime.onMessage.addListener(messageListener);
    fetch();

    return () => {
      browser.runtime.onMessage.removeListener(messageListener);
      tabBundleListSubscribers.splice(0);
    };
  }, []);

  useEffect(() => {
    if (!vm) {
      return;
    }

    const tids: { [name: number]: NodeJS.Timeout } = {};

    vm.tabBundles.forEach((item) => {
      if (item.id in timeoutId) {
        return;
      }

      const tid = setTimeout(() => {
        if (!vm) {
          return;
        }

        tabBundleController.delete(item.id);
        setClassName({ ...className, [item.id]: 'hide' });
      }, MINIMUM_TAB_BUNDLE_TIME);

      tids[item.id] = tid;
    });

    if (Object.keys(tids).length <= 0) {
      return;
    }

    setTimeoutId({ ...timeoutId, ...tids });
  });

  useEffect(() => {
    if (!vm) {
      return;
    }

    if (vm.tabBundles.length > 0) {
      const container = window.document.getElementById('notify-container');
      const size = {
        width: container.clientWidth,
        height: container.clientHeight,
      };

      browser.tabs
        .sendMessage(props.id, {
          action: ACTION.UPDATE_NOTIFY_CONTAINER,
          data: size,
        })
        .catch((e) => {
          logger.error(e);
        });
    } else {
      browser.tabs
        .sendMessage(props.id, {
          action: ACTION.DELETE_NOTIFY_CONTAINER,
        })
        .catch((e) => {
          logger.error(e);
        });
    }
  });

  if (!vm) {
    return <ThemeProvider theme={theme}></ThemeProvider>;
  }

  const handleUndo = (id: number, e: React.MouseEvent<HTMLAnchorElement>) => {
    tabBundleController.undo(props.id, id);
    setClassName({ ...className, [id]: 'hide' });
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
  };

  const handleRemove = (id: number, e: React.MouseEvent<HTMLAnchorElement>) => {
    tabBundleController.delete(id);
    setClassName({ ...className, [id]: 'hide' });
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
  };

  const onAnimationEnd = (id: number) => {
    if (!(id in className)) {
      return;
    }

    switch (className[id]) {
      case 'hide':
        fetch();
        break;
    }
  };

  const listItems = vm.tabBundles.map((item) => (
    <li
      key={item.id}
      className={`notify-card ${className[item.id] || 'show'}`}
      onAnimationEnd={
        onAnimationEnd.bind(
          null,
          item.id,
        ) as React.AnimationEventHandler<HTMLLIElement>
      }
    >
      <img
        className='icon'
        src={icon}
      />
      <div className='info'>
        <p className='message'>
          {i18n
            .get('message_drop_tabs')
            .replace(
              '{REMOVE_TAB_ALIGN}',
              item.direction === DIRECTION.LEFT
                ? i18n.get('title_left')
                : i18n.get('title_right'),
            )
            .replace('{REMOVE_TAB_LENGTH}', item.tabs.length.toString())}
        </p>
        <ul className='linkbox'>
          <li>
            <a
              href='#'
              onClick={
                handleUndo.bind(
                  null,
                  item.id,
                ) as React.MouseEventHandler<HTMLAnchorElement>
              }
            >
              {i18n.get('undo')}
            </a>
          </li>
          <li>
            <a
              href='#'
              onClick={
                handleRemove.bind(
                  null,
                  item.id,
                ) as React.MouseEventHandler<HTMLAnchorElement>
              }
            >
              {i18n.get('notify_remove')}
            </a>
          </li>
        </ul>
      </div>
    </li>
  ));

  return (
    <ThemeProvider theme={theme}>
      <ul
        id='notify-container'
        className='notify-container'
      >
        {listItems}
      </ul>
    </ThemeProvider>
  );
};

const root = createRoot(document.querySelector('#app'));
const sp = new URLSearchParams(window.location.search);
const id = Number(sp.get('id')) || 0;

root.render(<App id={id} />);
