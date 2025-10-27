// File: components/debug/FSMTracePanel.tsx

'use client';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useEffect, useState } from 'react';

const LOCAL_TRACE_LINES_KEY = 'latestFSMTraceLines';

let clearTrace: (() => void) | null = null;
let clearHeader: (() => void) | null = null;

/* ---------------------------- Debug logger toggle --------------------------- */
// NEW: panel trace logger (FSM panel diffs) controlled by env flag
const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_FSM_TRACE_PANEL === 'true';
const debugLog = createDebugLogger('FSMTracePanel', DEBUG_ENABLED, LOG_TIME);

export function clearFSMHeaderFromMemory(): void {
  try {
    localStorage.removeItem('latestFSMHeader');
    debugLog.log('Cleared latestFSMHeader from localStorage');
    if (clearHeader) clearHeader();
  } catch (_err) {
    debugLog.error('[FSMTracePanel] ❌ Failed to clear FSM Header');
  }
}

export function clearFSMTraceFromMemory(): void {
  try {
    localStorage.removeItem('latestFSMTrace');
    localStorage.removeItem(LOCAL_TRACE_LINES_KEY);
    debugLog.log('Cleared FSM trace from localStorage');
    if (clearTrace) clearTrace();
  } catch (_err) {
    debugLog.error('[FSMTracePanel] ❌ Failed to clear FSM trace');
  }
}

export default function FSMTracePanel({ visible }: { visible: boolean }) {
  const [traceLines, setTraceLines] = useState<string | null>(null);
  const [headerString, setHeaderString] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);

  useEffect(() => {
    clearTrace = () => {
      debugLog.log('🔁 clearTrace called');
      setTraceLines(null);
    };

    clearHeader = () => {
      debugLog.log('🔁 clearHeader called');
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

    try {
      const rawHeader = localStorage.getItem('latestFSMHeader');
      const rawLines = localStorage.getItem(LOCAL_TRACE_LINES_KEY);

      if (rawLines) setTraceLines(rawLines);
      else setTraceLines(null);

      if (rawHeader) {
        try {
          const parsedHeader = JSON.parse(rawHeader);
          const { timestamp: ts, ...rest } = parsedHeader ?? {};
          setHeaderString(JSON.stringify(rest, null, 2));
          setTimestamp(ts ?? null);
        } catch (_err) {
          debugLog.warn('[FSMTracePanel] ⚠️ Failed to parse rawHeader; showing raw text');
          setHeaderString(rawHeader);
          setTimestamp(null);
        }
      } else {
        setHeaderString(null);
        setTimestamp(null);
      }
    } catch (_err) {
      debugLog.error('[FSMTracePanel] ❌ Failed to load FSM trace');
      setTraceLines(null);
      setHeaderString(null);
      setTimestamp(null);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div>
      {/* Clear Buttons */}
      <div className="mb-[6px] flex flex-wrap gap-4">
        <button
          onClick={clearFSMHeaderFromMemory}
          className="rounded bg-[#243056] px-4 py-2 text-sm font-medium text-[#5981F3] hover:text-green-500"
        >
          🧹 Clear FSM Header
        </button>

        <button
          onClick={clearFSMTraceFromMemory}
          className="rounded bg-[#243056] px-4 py-2 text-sm font-medium text-[#5981F3] hover:text-green-500"
        >
          🧹 Clear FSM Trace
        </button>
      </div>

      <h3 className="text-lg font-semibold">
        📊 Last FSM State Trace{timestamp ? `: ${timestamp}` : ''}
      </h3>

      {headerString && (
        <pre className="mb-4 whitespace-pre-wrap bg-transparent p-1 font-mono text-md">
          {headerString}
        </pre>
      )}

      <pre className="mt-2 whitespace-pre-wrap rounded bg-gray-900 p-1 text-lg text-green-300">
        {traceLines ?? '[No FSM trace lines found]'}
      </pre>
    </div>
  );
}
