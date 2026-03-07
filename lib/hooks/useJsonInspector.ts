// File: @/lib/hooks/useJsonInspector.ts

import { useCallback, useEffect, useState } from 'react';

// 🔑 LocalStorage key (keep in sync with loader)
import { COLLAPSE_KEYS_MAP } from '@/lib/context/exchangeContext/localStorageKeys';

type CollapsedMap = Record<string, string[]>;

export function useJsonInspector(namespace: string) {
  const [collapsedKeys, setCollapsedKeys] = useState<string[]>([]);

  // Load from localStorage once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(COLLAPSE_KEYS_MAP);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const map = parsed as CollapsedMap;
          const keys = map[namespace];
          if (Array.isArray(keys)) {
            setCollapsedKeys(keys);
          }
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
      const raw = localStorage.getItem(COLLAPSE_KEYS_MAP);
      const parsed: CollapsedMap = raw
        ? (JSON.parse(raw) as CollapsedMap)
        : {};
      parsed[namespace] = collapsedKeys;
      localStorage.setItem(COLLAPSE_KEYS_MAP, JSON.stringify(parsed));
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
