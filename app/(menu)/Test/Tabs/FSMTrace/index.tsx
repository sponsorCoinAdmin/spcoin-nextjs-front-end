'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { usePageState } from '@/lib/context/PageStateContext';
import FSMTracePanel from '@/components/debug/FSMTracePanel';

const buttonClasses =
  'px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded transition-colors duration-150 hover:bg-[#5981F3] hover:text-[#243056]';

export default function FSMTraceTab() {
  const { setState } = usePageState();
  const [panelKey, setPanelKey] = useState(0); // force rerender after clears (match bottom buttons’ effect)

  const updateExchangePage = useCallback((updates: any) => {
    setState((prev: any) => ({
      ...prev,
      page: {
        ...prev?.page,
        exchangePage: {
          ...(prev?.page?.exchangePage ?? {}),
          ...updates,
        },
      },
    }));
  }, [setState]);

  const hideFSMTrace = useCallback(() => {
    updateExchangePage({ showFSMTracePanel: false });
  }, [updateExchangePage]);

  // Top buttons: mirror the bottom buttons’ functionality
  const clearFSMHeader = useCallback(() => {
    try {
      localStorage.removeItem('latestFSMHeader');
      localStorage.removeItem('latestFSMHeaderLines');
      console.log('[FSMTraceTab] 🧹 Cleared FSM header from localStorage');
    } catch (e) {
      console.warn('[FSMTraceTab] Failed to clear FSM header', e);
    } finally {
      setPanelKey((k) => k + 1); // refresh panel like the originals would
    }
  }, []);

  const clearFSMTrace = useCallback(() => {
    try {
      localStorage.removeItem('latestFSMTrace');
      localStorage.removeItem('latestFSMTraceLines');
      console.log('[FSMTraceTab] 🧹 Cleared FSM trace from localStorage');
    } catch (e) {
      console.warn('[FSMTraceTab] Failed to clear FSM trace', e);
    } finally {
      setPanelKey((k) => k + 1); // refresh panel like the originals would
    }
  }, []);

  // Remove the duplicated bottom buttons inside FSMTracePanel
  useEffect(() => {
    const container = document.getElementById('fsm-trace-panel-container');
    if (!container) return;
    const toRemove = Array.from(container.querySelectorAll('button')).filter((b) => {
      const t = (b.textContent || '').trim();
      return t === '🧹 Clear FSM Header' || t === '🧹 Clear FSM Trace';
    });
    toRemove.forEach((btn) => btn.remove());
  }, [panelKey]);

  return (
    <div className="space-y-4">
      {/* Top bar: centered clear buttons + X at top-right, shifted up 15px (to match ExchangeContext tab) */}
      <div className="relative w-full -mt-[15px]">
        {/* Centered controls at same level as the X */}
        <div className="flex flex-wrap items-center justify-center gap-4 py-2">
          <button onClick={clearFSMHeader} className={buttonClasses}>
            🧹 Clear FSM Header
          </button>
          <button onClick={clearFSMTrace} className={buttonClasses}>
            🧹 Clear FSM Trace
          </button>
        </div>

        {/* Top-right Close "X" (double text size like previous page) */}
        <button
          onClick={hideFSMTrace}
          aria-label="Close FSM Trace"
          title="Close FSM Trace"
          className="absolute top-1 right-1 h-10 w-10 rounded-full bg-[#243056] text-[#5981F3] flex items-center justify-center leading-none
                     hover:bg-[#5981F3] hover:text-[#243056] transition-colors text-3xl"
        >
          ×
        </button>
      </div>

      <div id="fsm-trace-panel-container" className="w-screen rounded-none shadow-inner p-4">
        <FSMTracePanel visible key={panelKey} />
      </div>
    </div>
  );
}
