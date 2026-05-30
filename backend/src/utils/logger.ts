const LOG_LEVEL = process.env.LOG_LEVEL || "info";

const levels: { [key: string]: number } = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};
export const logger = {
  debug: (module: string, message: string, data?: any) => {
    if (levels[LOG_LEVEL] <= levels["debug"]) {
      console.log(`[DEBUG] [${module}] ${message}`, data || "");
    }
  },
  info: (module: string, message: string, data?: any) => {
    if (levels[LOG_LEVEL] <= levels["info"]) {
      console.log(`[INFO] [${module}] ${message}`, data || "");
    }
  },
  warn: (module: string, message: string, data?: any) => {
    if (levels[LOG_LEVEL] <= levels["warn"]) {
      console.warn(`[WARN] [${module}] ${message}`, data || "");
    }
  },
  error: (module: string, message: string, error?: any) => {
    console.error(`[ERROR] [${module}] ${message}`, error || "");
  },
};

export default logger;
