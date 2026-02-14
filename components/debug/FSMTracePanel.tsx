// File: @/components/debug/FSMTracePanel.tsx
'use client';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useEffect, useRef, useState } from 'react';
import {
  LAST_FSM_TRACE_KEY,
  LATEST_FSM_HEADER_KEY,
} from '@/lib/context/exchangeContext/localStorageKeys';

const LOCAL_HEADER_KEY = LATEST_FSM_HEADER_KEY;
const LOCAL_TRACE_LINES_KEY = LAST_FSM_TRACE_KEY;
const LEGACY_TRACE_LINES_KEY = 'latestFSMTraceLines';
const LIVE_SYNC_MS = 250;

let clearTrace: (() => void) | null = null;
let clearHeader: (() => void) | null = null;

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_FSM_TRACE_PANEL === 'true';
const debugLog = createDebugLogger('FSMTracePanel', DEBUG_ENABLED, LOG_TIME);

export function clearFSMHeaderFromMemory(): void {
  try {
    localStorage.removeItem(LOCAL_HEADER_KEY);
    debugLog.log('Cleared latestFSMHeader from localStorage');
    if (clearHeader) clearHeader();
  } catch {
    debugLog.error('[FSMTracePanel] Failed to clear FSM Header');
  }
}

export function clearFSMTraceFromMemory(): void {
  try {
    localStorage.removeItem(LOCAL_TRACE_LINES_KEY);
    localStorage.removeItem(LEGACY_TRACE_LINES_KEY);
    debugLog.log('Cleared FSM trace from localStorage');
    if (clearTrace) clearTrace();
  } catch {
    debugLog.error('[FSMTracePanel] Failed to clear FSM trace');
  }
}

export default function FSMTracePanel({ visible }: { visible: boolean }) {
  const [traceLines, setTraceLines] = useState<string | null>(null);
  const [headerString, setHeaderString] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const lastRawHeaderRef = useRef<string | null>(null);
  const lastRawTraceRef = useRef<string | null>(null);
  const tracePreRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    clearTrace = () => {
      setTraceLines(null);
    };

    clearHeader = () => {
      setHeaderString(null);
      setTimestamp(null);
    };

    return () => {
      clearTrace = null;
      clearHeader = null;
    };
  }, []);

  useEffect(() => {
    if (!visible) return;

    const syncFromStorage = () => {
      try {
        const rawHeader = localStorage.getItem(LOCAL_HEADER_KEY);
        const rawLines = localStorage.getItem(LOCAL_TRACE_LINES_KEY);

        if (rawLines !== lastRawTraceRef.current) {
          lastRawTraceRef.current = rawLines;
          setTraceLines(rawLines);
        }

        if (rawHeader !== lastRawHeaderRef.current) {
          lastRawHeaderRef.current = rawHeader;

          if (rawHeader) {
            try {
              const parsedHeader = JSON.parse(rawHeader);
              const { timestamp: ts, ...rest } = parsedHeader ?? {};
              setHeaderString(JSON.stringify(rest, null, 2));
              setTimestamp(ts ?? null);
            } catch {
              debugLog.warn('[FSMTracePanel] Failed to parse rawHeader; showing raw text');
              setHeaderString(rawHeader);
              setTimestamp(null);
            }
          } else {
            setHeaderString(null);
            setTimestamp(null);
          }
        }
      } catch {
        debugLog.error('[FSMTracePanel] Failed to load FSM trace');
        setTraceLines(null);
        setHeaderString(null);
        setTimestamp(null);
      }
    };

    syncFromStorage();

    const intervalId = window.setInterval(syncFromStorage, LIVE_SYNC_MS);

    const onStorage = (event: StorageEvent) => {
      if (
        event.key === LOCAL_HEADER_KEY ||
        event.key === LOCAL_TRACE_LINES_KEY ||
        event.key === LEGACY_TRACE_LINES_KEY ||
        event.key === null
      ) {
        syncFromStorage();
      }
    };

    window.addEventListener('storage', onStorage);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('storage', onStorage);
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const el = tracePreRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [traceLines, visible]);

  if (!visible) return null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <h3 className="text-lg font-semibold">
        Latest FSM State Trace{timestamp ? `: ${timestamp}` : ''}
      </h3>

      {headerString && (
        <pre className="mb-4 whitespace-pre-wrap bg-transparent p-1 font-mono text-md">
          {headerString}
        </pre>
      )}

      <pre
        ref={tracePreRef}
        className="scrollbar-hide mt-2 min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap rounded bg-gray-900 p-1 text-lg text-green-300"
      >
        {traceLines ?? '[No FSM trace lines found]'}
      </pre>
    </div>
  );
}
