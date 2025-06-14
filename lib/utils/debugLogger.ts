// lib/utils/debugLogger.ts

interface DebugLogger {
  debug: (...args: any[]) => void;
  log: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  dump: () => string[];
  clear: () => void;
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * BigInt-safe JSON.stringify helper
 */
function serializeWithBigInt(obj: any): string {
  return JSON.stringify(obj, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
}

/**
 * Creates a module-scoped debug logger.
 *
 * @param moduleName - Name of the module using the logger
 * @param enabled - Whether to emit debug output (default: false)
 * @param tsFlag - Whether to include timestamps (default: true)
 * @param logLevel - Minimum log level to output (default: 'debug')
 */
export function createDebugLogger(
  moduleName: string,
  enabled: boolean,
  tsFlag: boolean = true,
  logLevel: LogLevel = 'debug'
): DebugLogger {
  const prefix = `[🛠️ ${moduleName}]`;
  const logBuffer: string[] = [];
  const shouldLog = enabled && process.env.NODE_ENV !== 'production';
  const minLevel = LEVEL_PRIORITY[logLevel];

  if (shouldLog) {
    const msg = `${prefix} DebugLogging ON — level=${logLevel}, timestamp=${tsFlag}`;
    console.log(msg);
    logBuffer.push(msg);
  }

  function formatLine(type: string, args: any[]): string {
    const ts = tsFlag ? `${new Date().toISOString()} ` : '';
    return `${ts}${prefix} ${type}: ${formatArgs(args)}`;
  }

  function formatArgs(args: any[]): string {
    return args
      .map((arg) => {
        if (typeof arg === 'string' && arg.includes('=') && !arg.includes('{') && !arg.includes('[')) {
          const [key, value] = arg.split('=');
          const paddedKey = key.trim().padEnd(16);
          return `${paddedKey}= ${value.trim()}`;
        }
        return formatArg(arg);
      })
      .join(' ');
  }

  function formatArg(arg: any): string {
    if (typeof arg === 'string') return arg;
    try {
      return serializeWithBigInt(arg);
    } catch {
      return '[Unserializable]';
    }
  }

  return {
    debug: (...args: any[]) => {
      if (shouldLog && minLevel <= LEVEL_PRIORITY.debug) {
        const line = formatLine('DEBUG', args);
        console.debug(line);
        logBuffer.push(line);
      }
    },
    log: (...args: any[]) => {
      if (shouldLog && minLevel <= LEVEL_PRIORITY.info) {
        const line = formatLine('LOG', args);
        console.log(line);
        logBuffer.push(line);
      }
    },
    warn: (...args: any[]) => {
      if (shouldLog && minLevel <= LEVEL_PRIORITY.warn) {
        const line = formatLine('WARN ⚠️', args);
        console.warn(line);
        logBuffer.push(line);
      }
    },
    error: (...args: any[]) => {
      if (shouldLog && minLevel <= LEVEL_PRIORITY.error) {
        const line = formatLine('ERROR ❌', args);
        console.error(line);
        logBuffer.push(line);
      }
    },
    dump: () => [...logBuffer],
    clear: () => {
      logBuffer.length = 0;
    },
  };
}
