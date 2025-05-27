// File: lib/hooks/useJsonInspector.ts

import { useCallback, useEffect, useState } from 'react';

const LOCAL_STORAGE_KEY = 'CollapsedKeysMap';

export function useJsonInspector(namespace: string) {
  const [collapsedKeys, setCollapsedKeys] = useState<string[]>([]);

  // Load from localStorage once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed[namespace])) {
          setCollapsedKeys(parsed[namespace]);
        }
      }
    } catch (err) {
      console.warn('Failed to load collapsedKeys:', err);
    }
  }, [namespace]);

  // Save to localStorage whenever collapsedKeys change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed[namespace] = collapsedKeys;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
    } catch (err) {
      console.warn('Failed to persist collapsedKeys:', err);
    }
  }, [collapsedKeys, namespace]);

  const updateCollapsedKeys = useCallback((next: string[]) => {
    setCollapsedKeys(next);
  }, []);

  const reset = useCallback(() => {
    setCollapsedKeys([]);
  }, []);

  return { collapsedKeys, updateCollapsedKeys, reset };
}
