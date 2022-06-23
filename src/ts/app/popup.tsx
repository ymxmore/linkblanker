import '../../sass/popup.scss';
import { FormControlLabel, Radio, RadioGroup, Switch } from '@mui/material';
import { cyan, grey, blueGrey, common } from '@mui/material/colors';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import React, { Key, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import browser from 'webextension-polyfill';
import { ACTION } from '@/app/constants';
import inject from '@/app/di/popup';
import { CLICK_POSITION } from '@/domain/entity/preference/clickPosition';
import I18nService from '@/domain/service/i18nService';
import LogService from '@/domain/service/logService';
import PreferenceController from '@/interface/controller/preferenceController';
import TabController from '@/interface/controller/tabController';
import AppPreferenceService, {
  DISABLED_STATE,
} from '@/interface/service/appPreferenceService';
import TabGetView from '@/interface/view/tab/tabGetView';
import TabListView from '@/interface/view/tab/tabListView';
import TabGetViewModel from '@/interface/viewmodel/tab/tabGetViewModel';
import { Value } from '@/usecase/preference/set/preferenceSetInputData';

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

const tabGetSubscribers: React.Dispatch<
  React.SetStateAction<TabGetViewModel>
>[] = [];

const tabGetView: TabGetView = (data) => {
  logger.debug('tabGetView', data);
  tabGetSubscribers.forEach((f) => f(data));
};

const tabListView: TabListView = (data) => {
  logger.debug('tabListView', data);

  // 全ての有効なタブへ更新通知
  data.tabs.forEach((tab) => {
    if (appPreferenceService.enabledUrl(tab.url.href)) {
      browser.tabs
        .sendMessage(tab.id, {
          action: ACTION.UPDATE_TAB,
        })
        .catch((e) => {
          logger.debug(e);
        });
    }
  });
};

const container = inject(browser, tabGetView, tabListView);

const logger = container.resolve<LogService>('LogService');

const appPreferenceService = container.resolve<AppPreferenceService>(
  'AppPreferenceService',
);

const preferenceController = container.resolve<PreferenceController>(
  'PreferenceController',
);

const tabController = container.resolve<TabController>('TabController');

const i18n = container.resolve<I18nService>('I18nService');

const manifest = browser.runtime.getManifest();

const fetch = () => {
  tabController.get();
};

const publish = () => {
  tabController.sync();
  tabController.list();
};

const onChanged = () => {
  publish();
  fetch();
};

const App = () => {
  const [vm, setTabGetViewModel] = useState<TabGetViewModel>();

  useEffect(() => {
    tabGetSubscribers.push(setTabGetViewModel);
    browser.storage.onChanged.addListener(onChanged);

    // 初期化
    preferenceController.init(manifest.version);

    // データ読み込み
    fetch();

    return () => {
      browser.storage.onChanged.removeListener(onChanged);
      tabGetSubscribers.splice(0);
    };
  }, []);

  if (!vm) {
    return (
      <ThemeProvider theme={theme}>
        <p>Now Loading...</p>
      </ThemeProvider>
    );
  }

  const { tab, preference } = vm;

  const enabledOpenFromUrl = appPreferenceService.enabledOpenFromUrl(
    tab.url.href,
    preference.enabledExtension,
    preference.disabledDomain,
    preference.disabledDirectory,
    preference.disabledPage,
    preference.disabledOn,
  );

  const header = (
    <header className='global-header'>
      <img
        className='icon'
        src={
          enabledOpenFromUrl
            ? '/img/icon-enabled.svg'
            : '/img/icon-disabled.svg'
        }
      />
      <div className='app-info'>
        <img
          className='logo'
          src='/img/logo.svg'
        />
        <p className='version-name'>Version {manifest.version}</p>
      </div>
    </header>
  );

  const footer = (
    <footer>
      <h2 className='popup-header'>Links</h2>

      <ul className='popup-list border-top'>
        <li>
          <a
            href={manifest.homepage_url}
            title={manifest.name}
            target='_blank'
            rel='noreferrer noopener'
          >
            {i18n.get('title_link_help')}
          </a>
        </li>
      </ul>
    </footer>
  );

  const enabledUrl = appPreferenceService.enabledUrl(tab.url.href);

  if (!enabledUrl) {
    return (
      <ThemeProvider theme={theme}>
        <section>
          {header}
          <section>
            <p>{i18n.get('warn_extention_work')}</p>
          </section>
          {footer}
        </section>
      </ThemeProvider>
    );
  }

  const disabledState = appPreferenceService.getDisabledState(
    tab.url.href,
    preference.disabledDomain,
    preference.disabledDirectory,
    preference.disabledPage,
    preference.disabledOn,
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === 'disabledState') {
      const data = {
        disabledDomain: false,
        disabledDirectory: false,
        disabledPage: false,
        disabledOn: false,
      } as Record<Key, Value>;

      switch (Number(e.target.value)) {
        case DISABLED_STATE.DOMAIN:
          data.disabledDomain = e.target.checked;
          break;
        case DISABLED_STATE.DIRECTORY:
          data.disabledDirectory = e.target.checked;
          break;
        case DISABLED_STATE.PAGE:
          data.disabledPage = e.target.checked;
          break;
        case DISABLED_STATE.ON:
          data.disabledOn = e.target.checked;
          break;
        default:
          break;
      }

      preferenceController.set(data);
    } else {
      preferenceController.set({ [e.target.name]: e.target.checked } as Record<
        Key,
        Value
      >);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      {header}
      <section>
        <h2 className='popup-header'>{i18n.get('title_whole_setting')}</h2>
        <ul className='popup-list border-top'>
          <li className='support'>
            <FormControlLabel
              control={
                <Switch
                  name='enabledExtension'
                  checked={preference.enabledExtension}
                  onChange={handleChange}
                />
              }
              label={i18n.get('title_operating_state')}
            />
          </li>
        </ul>
      </section>
      <section>
        <h2 className='popup-header'>{i18n.get('title_open_settings')}</h2>

        <ul className='popup-list border-top'>
          <li>
            <RadioGroup
              name='disabledState'
              value={disabledState}
              onChange={handleChange}
            >
              <FormControlLabel
                disabled={!preference.enabledExtension}
                value={DISABLED_STATE.OFF}
                control={<Radio />}
                label={i18n.get('title_disabled_off')}
              />
              <FormControlLabel
                disabled={!preference.enabledExtension}
                value={DISABLED_STATE.DOMAIN}
                control={<Radio />}
                label={i18n.get('title_disabled_domain')}
              />
              <FormControlLabel
                disabled={
                  !preference.enabledExtension || tab.url.directory === ''
                }
                value={DISABLED_STATE.DIRECTORY}
                control={<Radio />}
                label={i18n.get('title_disabled_directory')}
              />
              <FormControlLabel
                disabled={!preference.enabledExtension}
                value={DISABLED_STATE.PAGE}
                control={<Radio />}
                label={i18n.get('title_disabled_page')}
              />
              <FormControlLabel
                disabled={!preference.enabledExtension}
                value={DISABLED_STATE.ON}
                control={<Radio />}
                label={i18n.get('title_disabled_on')}
              />
            </RadioGroup>
          </li>
        </ul>

        <ul className='popup-list border-top'>
          <li className='split'>
            <FormControlLabel
              control={
                <Switch
                  name='clickPositionLeft'
                  checked={
                    (preference.clickPosition & CLICK_POSITION.LEFT) !== 0
                  }
                  onChange={handleChange}
                />
              }
              disabled={!preference.enabledExtension}
              label={i18n.get('title_left_click')}
            />
          </li>
          <li>
            <FormControlLabel
              control={
                <Switch
                  name='clickPositionMiddle'
                  checked={
                    (preference.clickPosition & CLICK_POSITION.MIDDLE) !== 0
                  }
                  onChange={handleChange}
                />
              }
              disabled={!preference.enabledExtension}
              label={i18n.get('title_middle_click')}
            />
          </li>
          <li>
            <FormControlLabel
              control={
                <Switch
                  name='clickPositionRight'
                  checked={
                    (preference.clickPosition & CLICK_POSITION.RIGHT) !== 0
                  }
                  onChange={handleChange}
                />
              }
              disabled={!preference.enabledExtension}
              label={i18n.get('title_right_click')}
            />
          </li>
        </ul>

        <ul className='popup-list border-top'>
          <li className='split'>
            <FormControlLabel
              control={
                <Switch
                  name='enabledBackgroundOpen'
                  checked={preference.enabledBackgroundOpen}
                  onChange={handleChange}
                />
              }
              disabled={!preference.enabledExtension}
              label={i18n.get('title_background_open')}
            />
          </li>
          <li>
            <FormControlLabel
              control={
                <Switch
                  name='disabledSameDomain'
                  checked={preference.disabledSameDomain}
                  onChange={handleChange}
                />
              }
              disabled={!preference.enabledExtension}
              label={i18n.get('title_disabled_same_domain')}
            />
          </li>
        </ul>
      </section>
      <section>
        <h2 className='popup-header'>{i18n.get('title_close_settings')}</h2>

        <ul className='popup-list border-top'>
          <li>
            <FormControlLabel
              control={
                <Switch
                  name='enabledMulticlickClose'
                  checked={preference.enabledMulticlickClose}
                  onChange={handleChange}
                />
              }
              disabled={!preference.enabledExtension}
              label={i18n.get('title_multiclick_close')}
            />
          </li>
          <li>
            <FormControlLabel
              control={
                <Switch
                  name='noCloseFixedTab'
                  checked={preference.noCloseFixedTab}
                  onChange={handleChange}
                />
              }
              disabled={!preference.enabledExtension}
              label={i18n.get('title_no_close_fixed_tab')}
            />
          </li>
        </ul>
      </section>
      {footer}
    </ThemeProvider>
  );
};

const root = createRoot(document.querySelector('#app'));
root.render(<App />);
