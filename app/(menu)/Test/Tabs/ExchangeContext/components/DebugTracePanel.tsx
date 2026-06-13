'use client';

import React, { useEffect, useState } from 'react';

import { MinusMarker, PlusMarker } from './Tree/Markers';
import {
  clearDebugTraceBuffer,
  getDebugTraceBuffer,
  isDebugTraceEnabled,
  setDebugTraceEnabled,
} from '@/lib/utils/debugTrace';

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
    </div>
  );
}
