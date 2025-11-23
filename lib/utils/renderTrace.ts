// File: lib/utils/renderTrace.ts
import { useEffect, useRef } from 'react';
import { createDebugLogger } from '@/lib/utils/debugLogger';

type AnyProps = Record<string, unknown>;

// 🔧 Env-gated render tracing
const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_TRACE_RENDER === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_HOOKS_LOGGING === 'true';

const debugLog = createDebugLogger('useRenderTrace', DEBUG_ENABLED, LOG_TIME);

export function useRenderTrace(name: string, props?: AnyProps) {
  const renderCount = useRef(0);
  const prev = useRef<AnyProps | null>(null);

  renderCount.current += 1;

  // Mount / unmount
  useEffect(() => {
    debugLog.log?.(`[TRACE][${name}] mount`);
    return () => {
      debugLog.log?.(`[TRACE][${name}] unmount`);
    };
  }, [name]);

  // Prop-change diff (opt-in via env)
  useEffect(() => {
    if (!props) return;

    const SHOW_DIFFS = process.env.NEXT_PUBLIC_TRACE_RENDER === 'true';

    if (!SHOW_DIFFS) {
      debugLog.log?.(
        `[TRACE][${name}] render #${renderCount.current}`,
      );
      prev.current = props;
      return;
    }

    const changed: Array<[string, unknown, unknown]> = [];

    if (prev.current) {
      for (const k of Object.keys(props)) {
        const prevV = prev.current[k];
        const nextV = props[k];
        if (prevV !== nextV) changed.push([k, prevV, nextV]);
      }
    }

    if (changed.length) {
      debugLog.log?.(
        `[TRACE][${name}] render #${renderCount.current} — changed props: ${changed
          .map(([k]) => k)
          .join(', ')}`,
      );
      for (const [k, a, b] of changed) {
        debugLog.log?.(` • ${k}:`, { prev: a, next: b });
      }
    } else {
      debugLog.log?.(
        `[TRACE][${name}] render #${renderCount.current} — no prop changes`,
      );
    }

    prev.current = props;
  });
}
