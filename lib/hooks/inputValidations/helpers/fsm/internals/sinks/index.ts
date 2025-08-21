// File: lib/hooks/inputValidations/helpers/fsm/internal/sinks/index.ts

// Note: This module is isomorphic (no "use client").
// Only the localStorage sink uses browser APIs and is lazy-loaded.

import { SP_COIN_DISPLAY, FEED_TYPE } from '@/lib/structure';
import { InputState } from '@/lib/structure/assetSelection';

/** Args passed when a trace session starts. */
export type TraceStartArgs = {
  containerType: SP_COIN_DISPLAY;
  debouncedHexInput: string;
  feedType: FEED_TYPE;
};

/** Minimal contract for a trace sink implementation. */
export type TraceSink = {
  onStart(args: TraceStartArgs): void;
  onTransition(prev: InputState, next: InputState): void;
  onFinish(finalState: InputState): void;
};

/** No-op sink used when tracing is disabled. */
const NOOP_TRACE_SINK: TraceSink = {
  onStart: () => {},
  onTransition: () => {},
  onFinish: () => {},
};

/**
 * Factory: returns a no-op sink when disabled; lazily loads the localStorage sink when enabled.
 * The localStorage sink is client-only and code-split away from non-trace builds.
 */
export async function createTraceSink(
  enabled: boolean,
  startArgs: TraceStartArgs
): Promise<TraceSink> {
  if (!enabled) return NOOP_TRACE_SINK;

  // Lazy-load the client-only sink (has "use client" in its own module)
  const { createLocalStorageTraceSink } = await import('./localStorage');
  const sink = createLocalStorageTraceSink();
  sink.onStart(startArgs);
  return sink;
}
