// File: lib/utils/renderTrace.ts
import { useEffect, useRef } from 'react';

type AnyProps = Record<string, unknown>;

export function useRenderTrace(name: string, props?: AnyProps) {
  const renderCount = useRef(0);
  const prev = useRef<AnyProps | null>(null);

  renderCount.current += 1;

  // Mount / unmount
  useEffect(() => {
    // always-on, super low cost
    console.log(`[TRACE][${name}] mount`);
    return () => console.log(`[TRACE][${name}] unmount`);
  }, [name]);

  // Prop-change diff (opt-in via env)
  useEffect(() => {
    if (!props) return;
    const SHOW_DIFFS = process.env.NEXT_PUBLIC_TRACE_RENDER === 'true';
    if (!SHOW_DIFFS) {
      console.log(`[TRACE][${name}] render #${renderCount.current}`);
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
      console.groupCollapsed(
        `[TRACE][${name}] render #${renderCount.current} — changed props: ${changed
          .map(([k]) => k)
          .join(', ')}`
      );
      for (const [k, a, b] of changed) {
        console.log(` • ${k}:`, { prev: a, next: b });
      }
      console.groupEnd();
    } else {
      console.log(`[TRACE][${name}] render #${renderCount.current} — no prop changes`);
    }
    prev.current = props;
  });
}
