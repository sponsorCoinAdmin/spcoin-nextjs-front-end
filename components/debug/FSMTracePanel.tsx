// File: components/debug/FSMTracePanel.tsx
'use client';

import { useEffect, useState } from 'react';
import { InputState, getInputStateString } from '@/lib/structure';

// ────── Global state accessors ──────
let clearTrace: (() => void) | null = null;
let clearHeader: (() => void) | null = null;

/**
 * Clears FSM trace and header data from localStorage and in-memory state.
 */
export function clearFSMHeaderFromMemory(): void {
  try {
    localStorage.removeItem('latestFSMHeader');
    console.log('[FSMTracePanel] 🧹 Cleared latestFSMHeader from localStorage');

    if (clearHeader) clearHeader(); // This sets headerString to null
  } catch (err) {
    console.error('[FSMTracePanel] ❌ Failed to clear FSM Header:', err);
  }
}

export function clearFSMTraceFromMemory(): void {
  try {
    localStorage.removeItem('latestFSMTrace');
    localStorage.removeItem('latestFSMTraceLines');
    console.log('[FSMTracePanel] 🧹 Cleared latestFSMTrace and latestFSMTraceLines from localStorage');

    if (clearTrace) clearTrace(); // This sets trace to null
    // Force rerender of <pre> block below by triggering state change (e.g., setTrace(null))
  } catch (err) {
    console.error('[FSMTracePanel] ❌ Failed to clear FSM trace:', err);
  }
}

export default function FSMTracePanel({ visible }: { visible: boolean }) {
  const [trace, setTrace] = useState<InputState[] | null>(null);
  const [headerString, setHeaderString] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);

  // Register clear callbacks
  useEffect(() => {
    clearTrace = () => setTrace(null);
    clearHeader = () => setHeaderString(null);

    return () => {
      clearTrace = null;
      clearHeader = null;
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    try {
      const rawTrace = localStorage.getItem('latestFSMTrace');
      const rawHeader = localStorage.getItem('latestFSMHeader');

      if (rawTrace) {
        const parsed = JSON.parse(rawTrace);
        setTrace(parsed);
      } else {
        setTrace(null);
      }

      if (rawHeader) {
        try {
          const parsedHeader = JSON.parse(rawHeader);
          const { timestamp, ...rest } = parsedHeader;
          setHeaderString(JSON.stringify(rest, null, 2));
          setTimestamp(timestamp ?? null);
        } catch (err) {
          console.warn('[FSMTracePanel] ⚠️ Failed to parse rawHeader');
          setHeaderString(rawHeader); // fallback
          setTimestamp(null);
        }
      } else {
        setHeaderString(null);
        setTimestamp(null);
      }
    } catch (err) {
      console.error('[FSMTracePanel] ❌ Failed to load FSM trace:', err);
      setTrace(null);
      setHeaderString(null);
      setTimestamp(null);
    }
  }, [visible]);

  if (!visible) return null;
  return (
    <div className="p-2 text-white text-base bg-gray-800 rounded border border-gray-600 max-w-full overflow-auto">
      {/* XXXXXX → Clear FSM Trace Button */}
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
        {typeof window !== 'undefined'
          ? localStorage.getItem('latestFSMTraceLines') ?? '[No FSM trace found]'
          : '[Window undefined]'}
      </pre>
    </div>
  );
}
