import LogService, { LogLevel, LOG_LEVEL } from '@/domain/service/logService';
import { getCurrentTime } from '@/helper';

export default class BrowserLogService implements LogService {
  constructor(private readonly console: Console, private logLevel?: LogLevel) {}

  setLogLevel(logLevel: LogLevel): void {
    this.logLevel = logLevel;
  }

  debug(...message: any): void {
    if (this.logLevel > LOG_LEVEL.DEBUG) {
      return;
    }

    this.console.log(new Date(getCurrentTime()), ...message);
  }

  info(...message: any): void {
    if (this.logLevel > LOG_LEVEL.INFO) {
      return;
    }

    this.console.info(new Date(getCurrentTime()), ...message);
  }

  warn(...message: any): void {
    if (this.logLevel > LOG_LEVEL.WARN) {
      return;
    }

    this.console.warn(new Date(getCurrentTime()), ...message);
  }

  error(...message: any): void {
    if (this.logLevel > LOG_LEVEL.ERROR) {
      return;
    }

    this.console.error(new Date(getCurrentTime()), ...message);
  }
}
