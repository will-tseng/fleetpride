const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  error: (...args) => {
    if (isDevelopment) {
      console.error(...args);
    }
  },
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  group: (...args) => {
    if (isDevelopment) {
      console.group(...args);
    }
  },
  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  }
};

export const emitDebugLog = () => {
  // Console logging disabled
};

export const isDebugEnabled = () => isDevelopment;

export const toggleConsoleLogs = (enabled) => {
  return enabled;
};
