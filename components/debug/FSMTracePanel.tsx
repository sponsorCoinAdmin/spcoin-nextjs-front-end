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
export function clearFSMTraceFromMemory(): void {
  try {
    localStorage.removeItem('latestFSMTrace');
    localStorage.removeItem('latestFSMHeader');
    console.log('[FSMTracePanel] 🧹 Cleared latestFSMTrace and latestFSMHeader from localStorage');

    // Clear in-memory state if component is mounted
    if (clearTrace) clearTrace();
    if (clearHeader) clearHeader();
  } catch (err) {
    console.error('[FSMTracePanel] ❌ Failed to clear FSM trace:', err);
  }
}

export default function FSMTracePanel({ visible }: { visible: boolean }) {
  const [trace, setTrace] = useState<InputState[] | null>(null);
  const [header, setHeader] = useState<string | null>(null);

  // Register clear callbacks for in-memory state
  useEffect(() => {
    clearTrace = () => setTrace(null);
    clearHeader = () => setHeader(null);

    return () => {
      clearTrace = null;
      clearHeader = null;
    };
  }, []);

  useEffect(() => {
    console.log('[FSMTracePanel] 🧪 useEffect triggered — visible =', visible);

    if (!visible) {
      console.log('[FSMTracePanel] 🚫 Exiting early — not visible');
      return;
    }

    try {
      const rawTrace = localStorage.getItem('latestFSMTrace');
      const rawHeader = localStorage.getItem('latestFSMHeader');

      console.log('[FSMTracePanel] 📥 Raw FSM trace:', rawTrace);
      console.log('[FSMTracePanel] 📥 Raw FSM header:', rawHeader);

      if (rawTrace) {
        const parsed = JSON.parse(rawTrace);
        console.log('[FSMTracePanel] ✅ Parsed FSM trace:', parsed);
        setTrace(parsed);
      } else {
        setTrace(null);
      }

      if (rawHeader) {
        setHeader(rawHeader);
      } else {
        setHeader(null);
      }
    } catch (err) {
      console.error('[FSMTracePanel] ❌ Failed to load FSM trace:', err);
      setTrace(null);
      setHeader(null);
    }
  }, [visible]);

  if (!visible) {
    console.log('[FSMTracePanel] ❌ Not visible — returning null');
    return null;
  }

  const getStateIcon = (state: InputState) => {
    switch (state) {
      case InputState.EMPTY_INPUT:
        return '🕳️';

      // 1️⃣ Hex input validation
      case InputState.INVALID_HEX_INPUT:
        return '🚫';
      case InputState.VALIDATE_ADDRESS:
        return '📬';
      case InputState.INCOMPLETE_ADDRESS:
        return '✂️';
      case InputState.INVALID_ADDRESS_INPUT:
        return '❓';

      // 2️⃣ Duplication check
      case InputState.TEST_DUPLICATE_INPUT:
        return '🧪';
      case InputState.DUPLICATE_INPUT_ERROR:
        return '❌';

      // 3️⃣ Preview check phase
      case InputState.VALIDATE_PREVIEW:
        return '🖼️';
      case InputState.PREVIEW_ADDRESS:
        return '🔎';
      case InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY:
        return '📁';
      case InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY:
        return '📂';

      // 4️⃣ Blockchain existence check
      case InputState.VALIDATE_EXISTS_ON_CHAIN:
        return '🛰️';
      case InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN:
        return '📵';

      // 5️⃣ Asset check (balance, metadata)
      case InputState.RESOLVE_ASSET:
        return '📊';
      case InputState.TOKEN_NOT_RESOLVED_ERROR:
        return '❗';
      case InputState.RESOLVE_ASSET_ERROR:
        return '💥';
      case InputState.MISSING_ACCOUNT_ADDRESS:
        return '🙈';

      // 6️⃣ Final delivery
      case InputState.UPDATE_VALIDATED_ASSET:
        return '✅';

      // 7️⃣ Final close
      case InputState.CLOSE_SELECT_PANEL:
        return '🔒';

      default:
        return '➖';
    }
  };

  const renderTraceWithIcons = (states: InputState[]) => {
    const pairs = [];
    for (let i = 0; i < states.length - 1; i++) {
      const from = states[i];
      const to = states[i + 1];
      const icon = i === 0 ? '🟢' : '🟡';

      pairs.push(
        <div key={i} className="font-mono">
          {`${icon} ${getStateIcon(from)} ${getInputStateString(from)} → ${getStateIcon(to)} ${getInputStateString(to)}`}
        </div>
      );
    }

    if (states.length === 1) {
      const only = states[0];
      pairs.push(
        <div key="only" className="font-mono">
          🟢 {getStateIcon(only)} {getInputStateString(only)}
        </div>
      );
    }

    return pairs;
  };

  return (
    <div className="p-2 text-white text-base bg-gray-800 rounded border border-gray-600 max-w-full overflow-auto">
      <h3 className="font-semibold mb-4 text-lg">📊 Last FSM State Trace:</h3>

      {header && (
        <pre className="whitespace-pre-wrap mb-4 font-mono text-sm bg-transparent">
          {header}
        </pre>
      )}

      {trace?.length ? (
        <div className="space-y-1">{renderTraceWithIcons(trace)}</div>
      ) : (
        <div className="italic text-gray-400">No FSM trace found.</div>
      )}
    </div>
  );
}
