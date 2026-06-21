'use client';

type DebugTraceData = Record<string, unknown> | undefined;

const DEBUG_TRACE_KEY = 'spcoin-debug-trace';
const DEBUG_TRACE_ENABLED_KEY = 'spcoin-debug-trace-enabled';
const DEBUG_TRACE_SINK_KEY = '__spCoinTraceSink';
const DEBUG_TRACE_BUFFER_KEY = '__spCoinDebugTrace';
const DEBUG_TRACE_EVENT = 'spcoin-debug-trace-update';

function safeStringify(data: DebugTraceData) {
  if (!data) return '';
  try {
    return `: ${JSON.stringify(data)}`;
  } catch {
    return ': [unserializable data]';
  }
}

export function appendDebugTrace(message: string, data?: DebugTraceData) {
  const line = `${message}${safeStringify(data)}`;
  console.log(line);

  if (typeof window === 'undefined') return line;

  if (!isDebugTraceEnabled()) {
    return line;
  }

  const win = window as Window & {
    [DEBUG_TRACE_SINK_KEY]?: (line: string) => void;
    [DEBUG_TRACE_BUFFER_KEY]?: string[];
  };

  const nextBuffer = [...(win[DEBUG_TRACE_BUFFER_KEY] ?? []), line].slice(-200);
  win[DEBUG_TRACE_BUFFER_KEY] = nextBuffer;
  removePersistedDebugTrace();

  win[DEBUG_TRACE_SINK_KEY]?.(line);
  window.dispatchEvent(
    new CustomEvent(DEBUG_TRACE_EVENT, {
      detail: { line, buffer: nextBuffer },
    }),
  );

  return line;
}

export function installDebugTraceSink(sink?: (line: string) => void) {
  if (typeof window === 'undefined') return;

  const win = window as Window & {
    [DEBUG_TRACE_SINK_KEY]?: (line: string) => void;
  };

  if (sink) {
    win[DEBUG_TRACE_SINK_KEY] = sink;
  } else {
    delete win[DEBUG_TRACE_SINK_KEY];
  }
}

export function getDebugTraceBuffer(): string[] {
  if (typeof window === 'undefined') return [];

  const win = window as Window & {
    [DEBUG_TRACE_BUFFER_KEY]?: string[];
  };
  const memoryBuffer = (win[DEBUG_TRACE_BUFFER_KEY] ?? []).filter(
    (line): line is string => typeof line === 'string',
  );

  removePersistedDebugTrace();
  return memoryBuffer;
}

export function isDebugTraceEnabled(): boolean {
  if (typeof window === 'undefined') return true;

  try {
    const raw = window.localStorage.getItem(DEBUG_TRACE_ENABLED_KEY);
    if (raw == null) return true;
    return raw !== 'false';
  } catch {
    return true;
  }
}

export function setDebugTraceEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(DEBUG_TRACE_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch {
    // Best-effort only.
  }

  window.dispatchEvent(
    new CustomEvent(DEBUG_TRACE_EVENT, {
      detail: { enabled },
    }),
  );
}

function removePersistedDebugTrace() {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(DEBUG_TRACE_KEY);
  } catch {
    // Best-effort trace cleanup only.
  }
}

export function clearDebugTraceBuffer() {
  if (typeof window === 'undefined') return;

  const win = window as Window & {
    [DEBUG_TRACE_BUFFER_KEY]?: string[];
  };

  win[DEBUG_TRACE_BUFFER_KEY] = [];

  removePersistedDebugTrace();

  window.dispatchEvent(
    new CustomEvent(DEBUG_TRACE_EVENT, {
      detail: { buffer: [] },
    }),
  );
}
