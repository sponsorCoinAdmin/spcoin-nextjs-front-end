// File: @/lib/hooks/perf/useRenderCounter.ts
// Count renders of a component. Safe no-op unless enabled.
// Env flag: NEXT_PUBLIC_RENDER_COUNTER = 'true' | 'false' (default: false)
'use client';

import { useRef } from 'react';

const RC_ON =
  typeof window !== 'undefined' && process.env.NEXT_PUBLIC_RENDER_COUNTER === 'true';

export function useRenderCounter(name: string) {
  const countRef = useRef(0);
  countRef.current += 1;

  if (RC_ON) {
    // eslint-disable-next-line no-console
    console.debug(`[render] ${name}: #${countRef.current}`);
  }

  return countRef.current;
}
