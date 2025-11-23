// File: @/lib/hooks/inputValidations/helpers/logStateChanges.ts

import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_FSM === 'true';
const debugLog = createDebugLogger('logStateChanges', DEBUG_ENABLED, LOG_TIME);

/**
 * Logs state/parameter changes between renders.
 *
 * @param prev - The previous value of the object to compare.
 * @param current - The current value of the object to compare.
 * @param keys - List of keys to compare and log changes for.
 * @param label - Optional label for the log output (defaults to "Changes").
 */
export function logStateChanges<T extends Record<string, any>>(
  prev: T | null,
  current: T,
  keys: (keyof T)[],
  label: string = 'Changes'
): void {
  if (!prev) return;

  const changes: string[] = [];

  keys.forEach((key) => {
    if (prev[key] !== current[key]) {
      const prevVal = formatValue(prev[key]);
      const currVal = formatValue(current[key]);
      changes.push(`${String(key)}\n  ${prevVal} → ${currVal}`);
    }
  });

  if (changes.length > 0) {
    debugLog.log(`ℹ️ ${label}:\n\n${changes.join('\n\n')}`);
  }
}

function formatValue(value: any): string {
  if (typeof value === 'function') return '[function]';
  if (typeof value === 'object' && value !== null) return JSON.stringify(value);
  return String(value);
}
