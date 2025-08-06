// File: lib/hooks/useFSMHeaderTrace.ts

'use client';

import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { useCallback, useEffect, useRef, useState } from 'react';

const LOCAL_HEADER_KEY = 'latestFSMHeader';

type FSMHeaderData = Record<string, string>;

export function useFSMHeaderTrace() {
  const [fsmHeaderData, setFSMHeaderData] = useState<FSMHeaderData>({});
  const dataRef = useRef<FSMHeaderData>({});

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_HEADER_KEY);
      if (stored) {
        console.log('[useFSMHeaderTrace] ✅ Loaded from localStorage:', stored);
        const parsed = JSON.parse(stored);
        setFSMHeaderData(parsed);
        dataRef.current = parsed;
      } else {
        console.log('[useFSMHeaderTrace] 🆕 No existing localStorage. Initializing...');
        localStorage.setItem(LOCAL_HEADER_KEY, stringifyBigInt({}));
        setFSMHeaderData({});
        dataRef.current = {};
      }
    } catch (err) {
      console.error('[useFSMHeaderTrace] ❌ Failed to load or initialize localStorage:', err);
    }
  }, []);

  const syncLocalStorage = useCallback((data: FSMHeaderData) => {
    try {
      localStorage.setItem(LOCAL_HEADER_KEY, stringifyBigInt(data));
      console.log('[useFSMHeaderTrace] 💾 Synced localStorage:', data);
    } catch (err) {
      console.error('[useFSMHeaderTrace] ❌ Failed to sync localStorage:', err);
    }
  }, []);

  const addFSMKeyValue = useCallback((field: string, value: string) => {
    console.log(`[useFSMHeaderTrace] ➕ Adding key: "${field}" with value: "${value}"`);
    setFSMHeaderData(prev => {
      const updated = {
        ...prev,
        [field]: value,
        timestamp: new Date().toLocaleString(), // ✅ Add timestamp
      };
      dataRef.current = updated;
      syncLocalStorage(updated);
      return updated;
    });
  }, [syncLocalStorage]);

  const removeFSMStorage = useCallback((field: string) => {
    console.log(`[useFSMHeaderTrace] 🗑️ Deleting key: "${field}"`);
    setFSMHeaderData(prev => {
      const updated = { ...prev };
      delete updated[field];
      dataRef.current = updated;
      syncLocalStorage(updated);
      return updated;
    });
  }, [syncLocalStorage]);

  const reset = useCallback(() => {
    console.log('[useFSMHeaderTrace] 🔄 Resetting FSM header data');
    setFSMHeaderData({});
    dataRef.current = {};
    try {
      console.log('[useFSMHeaderTrace] 🧹 Cleared localStorage key:', LOCAL_HEADER_KEY);
    } catch (err) {
      console.error('[useFSMHeaderTrace] ❌ Failed to clear localStorage:', err);
    }
  }, []);

  return {
    fsmHeaderData,
    addFSMKeyValue,
    deleteFSMKeyValue: removeFSMStorage,
    reset,
  };
}
