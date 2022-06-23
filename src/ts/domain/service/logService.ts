export const LOG_LEVEL = {
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
} as const;

export type LogLevel = typeof LOG_LEVEL[keyof typeof LOG_LEVEL];

export default interface LogService {
  setLogLevel(level: LogLevel);
  debug(...message: any);
  info(...message: any);
  warn(...message: any);
  error(...message: any);
}
