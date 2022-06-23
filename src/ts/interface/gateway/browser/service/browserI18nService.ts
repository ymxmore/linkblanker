import { Browser } from 'webextension-polyfill';
import I18nService from '@/domain/service/i18nService';

export default class BrowserI18nService implements I18nService {
  constructor(private readonly browser: Browser) {}

  get(key: string): string {
    return this.browser.i18n.getMessage(key);
  }
}
