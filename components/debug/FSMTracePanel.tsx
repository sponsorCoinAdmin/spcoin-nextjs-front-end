// File: components/debug/FSMTracePanel.tsx

'use client';

import type { InputState } from '@/lib/structure/assetSelection';
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
  } catch (err) {
    console.error('[FSMTracePanel] ❌ Failed to clear FSM Header:', err);
  }
}

export function clearFSMTraceFromMemory(): void {
  try {
    localStorage.removeItem('latestFSMTrace');
    localStorage.removeItem(LOCAL_TRACE_LINES_KEY);
    debugLog.log('Cleared FSM trace from localStorage');
    if (clearTrace) clearTrace();
  } catch (err) {
    console.error('[FSMTracePanel] ❌ Failed to clear FSM trace:', err);
  }
}

export default function FSMTracePanel({ visible }: { visible: boolean }) {
  const [trace, setTrace] = useState<InputState[] | null>(null);
  const [traceLines, setTraceLines] = useState<string | null>(null);
  const [headerString, setHeaderString] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);

  useEffect(() => {
    clearTrace = () => {
      debugLog.log('🔁 clearTrace called');
      setTrace(null);
      setTraceLines(null);
    };

    clearHeader = () => {
      debugLog.log('🔁 clearHeader called');
      setHeaderString(null);
    };

    return () => {
      clearTrace = null;
      clearHeader = null;
    };
  }, []);

  useEffect(() => {
    if (!visible) return;

    try {
      const rawTrace = localStorage.getItem('latestFSMTrace');
      const rawHeader = localStorage.getItem('latestFSMHeader');
      const rawLines = localStorage.getItem(LOCAL_TRACE_LINES_KEY);

      if (rawTrace) {
        const parsed: InputState[] = JSON.parse(rawTrace);
        setTrace(parsed);
      } else {
        setTrace(null);
      }

      if (rawLines) {
        setTraceLines(rawLines);
      } else {
        setTraceLines(null);
      }

      if (rawHeader) {
        try {
          const parsedHeader = JSON.parse(rawHeader);
          const { timestamp, ...rest } = parsedHeader;
          setHeaderString(JSON.stringify(rest, null, 2));
          setTimestamp(timestamp ?? null);
        } catch (err) {
          console.warn('[FSMTracePanel] ⚠️ Failed to parse rawHeader');
          setHeaderString(rawHeader);
          setTimestamp(null);
        }
      } else {
        setHeaderString(null);
        setTimestamp(null);
      }
    } catch (err) {
      console.error('[FSMTracePanel] ❌ Failed to load FSM trace:', err);
      setTrace(null);
      setTraceLines(null);
      setHeaderString(null);
      setTimestamp(null);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div>
      {/* Clear Buttons */}
      <div className="flex flex-wrap gap-4 mb-[6px]">
        <button
          onClick={clearFSMHeaderFromMemory}
          className="px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded hover:text-green-500">
          🧹 Clear FSM Header
        </button>

        <button
          onClick={clearFSMTraceFromMemory}
          className="px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded hover:text-green-500">
          🧹 Clear FSM Trace
        </button>
      </div>

      <h3 className="font-semibold text-lg">
        📊 Last FSM State Trace{timestamp ? `: ${timestamp}` : ''}
      </h3>

      {headerString && (
        <pre className="whitespace-pre-wrap mb-4 p-1 font-mono text-md bg-transparent">
          {headerString}
        </pre>
      )}

      <pre className="bg-gray-900 text-green-300 text-lg p-1 rounded whitespace-pre-wrap mt-2">
        {traceLines ?? '[No FSM trace lines found]'}
      </pre>
 
    </div>
  );
}
