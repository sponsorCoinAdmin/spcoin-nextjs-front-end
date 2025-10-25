// File: lib/utils/logEffectReasons.ts
import { useEffect, useRef } from 'react';

export function useEffectReasons<T extends Record<string, unknown>>(
  name: string,
  depsObj: T
) {
  const prev = useRef<T | null>(null);

  useEffect(() => {
    const keys = Object.keys(depsObj) as (keyof T)[];
    if (!prev.current) {
      console.log(`[TRACE][${name}] effect run (first)`, depsObj);
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
      console.groupCollapsed(
        `[TRACE][${name}] effect re-run — changed: ${changed.map(([k]) => String(k)).join(', ')}`
      );
      for (const [k, a, b] of changed) {
        console.log(` • ${String(k)}:`, { prev: a, next: b });
      }
      console.groupEnd();
    } else {
      console.log(`[TRACE][${name}] effect re-run — but no deps changed?`);
    }
    prev.current = depsObj;
  });
}
