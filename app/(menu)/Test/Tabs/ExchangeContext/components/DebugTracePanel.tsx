'use client';

import React, { useEffect, useState } from 'react';

import { MinusMarker, PlusMarker } from './Tree/Markers';
import {
  clearDebugTraceBuffer,
  getDebugTraceBuffer,
  isDebugTraceEnabled,
  setDebugTraceEnabled,
} from '@/lib/utils/debugTrace';
import ConfirmModal from '@/components/modals/ConfirmModal';

const DEBUG_TRACE_EVENT = 'spcoin-debug-trace-update';

type DebugTraceEventDetail = {
  line?: string;
  buffer?: string[];
  enabled?: boolean;
};

export default function DebugTracePanel() {
  const [lines, setLines] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [enabled, setEnabledState] = useState<boolean>(() => isDebugTraceEnabled());
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setLines(enabled ? getDebugTraceBuffer() : []);

    const handleUpdate = (event: Event) => {
      const detail = (event as CustomEvent<DebugTraceEventDetail>).detail;

      if (typeof detail?.enabled === 'boolean') {
        setEnabledState(detail.enabled);
        if (!detail.enabled) {
          setLines([]);
        } else {
          setLines(getDebugTraceBuffer());
        }
        return;
      }

      if (Array.isArray(detail?.buffer)) {
        setLines(enabled ? detail.buffer : []);
      } else {
        setLines(enabled ? getDebugTraceBuffer() : []);
      }
    };

    window.addEventListener(DEBUG_TRACE_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(DEBUG_TRACE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [enabled]);

  const handleToggleEnabled = () => {
    const next = !enabled;
    setEnabledState(next);
    setDebugTraceEnabled(next);
    if (!next) {
      clearDebugTraceBuffer();
      setLines([]);
    } else {
      setLines(getDebugTraceBuffer());
    }
  };

  const handleConfirmClear = () => {
    clearDebugTraceBuffer();
    setLines([]);
    setConfirmOpen(false);
  };

  const handleCopyLog = async () => {
    const text = lines.join('\n');
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
  };

  return (
    <div className="m-0 p-0 font-mono text-[#91a5ff]">
      <div className="flex items-center gap-2 leading-tight">
        {expanded ? (
          <MinusMarker
            title="Collapse trace log"
            onClick={() => setExpanded(false)}
            className="mr-0"
            ariaExpanded={expanded}
          />
        ) : (
          <PlusMarker
            title="Expand trace log"
            onClick={() => setExpanded(true)}
            className="mr-0"
            ariaExpanded={expanded}
          />
        )}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={enabled}
            onChange={handleToggleEnabled}
            className="h-4 w-4 cursor-pointer"
            aria-label="Enable trace log"
          />
          <span className="text-sm font-semibold">Trace Log</span>
        </label>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="rounded px-2 py-0.5 text-sm font-semibold text-[#5981F3] bg-[#243056] hover:bg-[#5981F3] hover:text-[#243056] transition-colors"
          aria-label="Clear trace log"
        >
          Clear Log
        </button>
        <button
          type="button"
          onClick={handleCopyLog}
          className="rounded px-2 py-0.5 text-sm font-semibold text-[#5981F3] bg-[#243056] hover:bg-[#5981F3] hover:text-[#243056] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Copy trace log"
          disabled={lines.length === 0}
        >
          Copy Log
        </button>
      </div>

      {expanded ? (
        <div className="ml-6 mt-1 max-h-64 overflow-y-auto scrollbar-hide">
          {enabled ? (
            lines.length > 0 ? (
              <div className="space-y-0.5 text-xs leading-5 text-[#c0cbff]">
                {lines.map((line, index) => (
                  <div key={`${index}:${line}`} className="whitespace-pre-wrap break-words">
                    {line}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400">No trace entries yet.</div>
            )
          ) : (
            <div className="text-xs text-slate-400">Trace logging is off.</div>
          )}
        </div>
      ) : null}

      <ConfirmModal
        isOpen={confirmOpen}
        title="Clear Trace Log"
        message="Are you sure you want to clear the trace log? This cannot be undone."
        cancelLabel="Cancel"
        confirmLabel="Clear"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmClear}
      />
    </div>
  );
}
