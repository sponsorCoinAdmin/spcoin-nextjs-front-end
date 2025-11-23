// File: lib/utils/logEffectReasons.ts
import { useEffect, useRef } from 'react';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_HOOKS_LOGGING === 'true';

const debugLog = createDebugLogger('useEffectReasons', DEBUG_ENABLED, LOG_TIME);

export function useEffectReasons<T extends Record<string, unknown>>(
  name: string,
  depsObj: T
) {
  const prev = useRef<T | null>(null);

  useEffect(() => {
    const keys = Object.keys(depsObj) as (keyof T)[];

    if (!prev.current) {
      debugLog.log?.(`[TRACE][${name}] effect run (first)`, depsObj);
      prev.current = depsObj;
      return;
    }

    const changed: Array<[keyof T, unknown, unknown]> = [];
    for (const k of keys) {
      const a = prev.current[k];
      const b = depsObj[k];
      if (a !== b) changed.push([k, a, b]);
    }

    if (changed.length) {
      debugLog.log?.(
        `[TRACE][${name}] effect re-run — changed: ${changed
          .map(([k]) => String(k))
          .join(', ')}`
      );
      for (const [k, a, b] of changed) {
        debugLog.log?.(` • ${String(k)}:`, { prev: a, next: b });
      }
    } else {
      debugLog.log?.(
        `[TRACE][${name}] effect re-run — but no deps changed?`,
        depsObj
      );
    }

    prev.current = depsObj;
  });
}
