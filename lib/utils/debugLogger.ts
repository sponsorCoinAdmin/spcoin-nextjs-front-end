// File: lib/utils/debugLogger.ts

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
 * Determines if a log should be emitted based on level and environment
 */
function shouldEmit(level: LogLevel, minLevel: number, enabled: boolean): boolean {
  return enabled && LEVEL_PRIORITY[level] >= minLevel && process.env.NODE_ENV !== 'production';
}

/**
 * If the last argument is a valid log level, treat it as override
 */
function extractLevel(args: any[], defaultLevel: LogLevel): { actualArgs: any[]; level: LogLevel } {
  const maybeLevel = args[args.length - 1];
  if (typeof maybeLevel === 'string' && maybeLevel in LEVEL_PRIORITY) {
    return { actualArgs: args.slice(0, -1), level: maybeLevel as LogLevel };
  }
  return { actualArgs: args, level: defaultLevel };
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
  const minLevel = LEVEL_PRIORITY[logLevel];

  if (enabled && process.env.NODE_ENV !== 'production') {
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
      const { actualArgs, level } = extractLevel(args, 'debug');
      if (shouldEmit(level, minLevel, enabled)) {
        const line = formatLine('DEBUG', actualArgs);
        console.debug(line);
        logBuffer.push(line);
      }
    },
    log: (...args: any[]) => {
      const { actualArgs, level } = extractLevel(args, 'info');
      if (shouldEmit(level, minLevel, enabled)) {
        const line = formatLine('LOG', actualArgs);
        console.log(line);
        logBuffer.push(line);
      }
    },
    warn: (...args: any[]) => {
      const { actualArgs, level } = extractLevel(args, 'warn');
      if (shouldEmit(level, minLevel, enabled)) {
        const line = formatLine('WARN ⚠️', actualArgs);
        console.warn(line);
        logBuffer.push(line);
      }
    },
    error: (...args: any[]) => {
      const { actualArgs, level } = extractLevel(args, 'error');
      if (shouldEmit(level, minLevel, enabled)) {
        const line = formatLine('ERROR ❌', actualArgs);
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
