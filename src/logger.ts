export type Logger = {
  info(message: string, ...meta: any[]): void;
  error(message: string, ...meta: any[]): void;
  debug(message: string, ...meta: any[]): void;
};

export function makeLogger(logLevel = 'error'): Logger {
  return {
    info(message: string, ...meta): void {
      if (['info', 'debug'].includes(logLevel)) {
        console.info(message, ...meta);
      }
    },
    error(message: string, ...meta): void {
      if (['error', 'info', 'debug'].includes(logLevel)) {
        console.error(message, ...meta);
      }
    },
    debug(message: string, ...meta): void {
      if (logLevel === 'debug') {
        console.debug(message, ...meta);
      }
    },
  };
}
