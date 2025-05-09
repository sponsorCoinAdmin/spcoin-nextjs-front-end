// lib/utils/debugLogger.ts

interface DebugLogger {
  log: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  dump: () => string[];
  clear: () => void;
}

/**
 * Creates a module-scoped debug logger.
 *
 * @param moduleName - Name of the module using the logger
 * @param enabled - Whether to emit debug output (default: false)
 * @param tsFlag - Whether to include timestamps in log lines (default: true)
 */
export function createDebugLogger(moduleName: string, enabled: boolean, tsFlag: boolean = true): DebugLogger {
  const prefix = `[🛠️ ${moduleName}]`;
  const logBuffer: string[] = [];

  const shouldLog = enabled && process.env.NODE_ENV !== 'production';

  if (shouldLog) {
    const msg = `${prefix} DebugLogging ON — to disable, set enabled=false or tsFlag=false (timestamp=${tsFlag})`;
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
      return JSON.stringify(arg);
    } catch {
      return '[Unserializable]';
    }
  }

  return {
    log: (...args: any[]) => {
      if (shouldLog) {
        const line = formatLine('LOG', args);
        console.log(line);
        logBuffer.push(line);
      }
    },
    warn: (...args: any[]) => {
      if (shouldLog) {
        const line = formatLine('WARN ⚠️', args);
        console.warn(line);
        logBuffer.push(line);
      }
    },
    error: (...args: any[]) => {
      if (shouldLog) {
        const line = formatLine('ERROR ❌', args);
        console.error(line);
        logBuffer.push(line);
      }
    },
    dump: () => [...logBuffer],
    clear: () => {
      logBuffer.length = 0;
    }
  };
}
