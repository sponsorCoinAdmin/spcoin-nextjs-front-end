// File: lib/hooks/perf/usePerfMarks.ts
// Tiny wrapper around Performance API. Safe no-op unless enabled.
// Env flag: NEXT_PUBLIC_PERF_MARKS = 'true' | 'false' (default: false)
'use client';

import { useCallback } from 'react';

const PERF_ON =
  typeof window !== 'undefined' && process.env.NEXT_PUBLIC_PERF_MARKS === 'true';

export function usePerfMarks(base: string) {
  const start = useCallback(() => {
    if (!PERF_ON || typeof performance === 'undefined') return;
    performance.mark(`${base}:start`);
  }, [base]);

  const end = useCallback((label?: string) => {
    if (!PERF_ON || typeof performance === 'undefined') return;
    const s = `${base}:start`;
    const e = `${base}:end`;
    performance.mark(e);
    try {
      performance.measure(label ? `${base}:${label}` : base, s, e);
    } catch {
      /* ignore */
    } finally {
      performance.clearMarks(s);
      performance.clearMarks(e);
    }
  }, [base]);

  // Convenience wrapper if you want to time an inline function
  const time = useCallback(<T,>(label: string, fn: () => T): T => {
    if (!PERF_ON || typeof performance === 'undefined') return fn();
    const s = `${base}:${label}:s`;
    const e = `${base}:${label}:e`;
    performance.mark(s);
    try {
      return fn();
    } finally {
      performance.mark(e);
      try { performance.measure(`${base}:${label}`, s, e); } catch { /* ignore */ }
      performance.clearMarks(s);
      performance.clearMarks(e);
    }
  }, [base]);

  return { start, end, time };
}
