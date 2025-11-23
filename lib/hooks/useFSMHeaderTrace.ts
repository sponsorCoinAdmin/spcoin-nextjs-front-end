// File: @/lib/hooks/useFSMHeaderTrace.ts

'use client';

import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOCAL_HEADER_KEY = 'latestFSMHeader';

type FSMHeaderData = Record<string, string>;

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_FSM === 'true';

const debugLog = createDebugLogger('useFSMHeaderTrace', DEBUG_ENABLED, LOG_TIME);

export function useFSMHeaderTrace() {
  const [fsmHeaderData, setFSMHeaderData] = useState<FSMHeaderData>({});
  const dataRef = useRef<FSMHeaderData>({});

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_HEADER_KEY);
      if (stored) {
        debugLog.log?.('[useFSMHeaderTrace] ✅ Loaded from localStorage', { stored });
        const parsed = JSON.parse(stored);
        setFSMHeaderData(parsed);
        dataRef.current = parsed;
      } else {
        debugLog.log?.(
          '[useFSMHeaderTrace] 🆕 No existing localStorage. Initializing empty header...',
        );
        localStorage.setItem(LOCAL_HEADER_KEY, stringifyBigInt({}));
        setFSMHeaderData({});
        dataRef.current = {};
      }
    } catch (err) {
      debugLog.error?.(
        '[useFSMHeaderTrace] ❌ Failed to load or initialize localStorage',
        err,
      );
    }
  }, []);

  const syncLocalStorage = useCallback((data: FSMHeaderData) => {
    try {
      localStorage.setItem(LOCAL_HEADER_KEY, stringifyBigInt(data));
      debugLog.log?.('[useFSMHeaderTrace] 💾 Synced localStorage', { data });
    } catch (err) {
      debugLog.error?.('[useFSMHeaderTrace] ❌ Failed to sync localStorage', err);
    }
  }, []);

  const addFSMKeyValue = useCallback(
    (field: string, value: string) => {
      debugLog.log?.('[useFSMHeaderTrace] ➕ Adding key/value', { field, value });
      setFSMHeaderData((prev) => {
        const updated = {
          ...prev,
          [field]: value,
          timestamp: new Date().toLocaleString(), // ✅ Add timestamp
        };
        dataRef.current = updated;
        syncLocalStorage(updated);
        return updated;
      });
    },
    [syncLocalStorage],
  );

  const removeFSMStorage = useCallback(
    (field: string) => {
      debugLog.log?.('[useFSMHeaderTrace] 🗑️ Deleting key', { field });
      setFSMHeaderData((prev) => {
        const updated = { ...prev };
        delete updated[field];
        dataRef.current = updated;
        syncLocalStorage(updated);
        return updated;
      });
    },
    [syncLocalStorage],
  );

  const reset = useCallback(() => {
    debugLog.log?.('[useFSMHeaderTrace] 🔄 Resetting FSM header data');
    setFSMHeaderData({});
    dataRef.current = {};
    try {
      debugLog.log?.('[useFSMHeaderTrace] 🧹 Clearing localStorage key', {
        key: LOCAL_HEADER_KEY,
      });
      // (Behavior unchanged: no removeItem previously, just logging intent)
    } catch (err) {
      debugLog.error?.('[useFSMHeaderTrace] ❌ Failed to clear localStorage', err);
    }
  }, []);

  return {
    fsmHeaderData,
    addFSMKeyValue,
    deleteFSMKeyValue: removeFSMStorage,
    reset,
  };
}
