// File: lib/hooks/useJsonInspector.ts

import { useCallback, useEffect, useRef, useState } from 'react';

import { COLLAPSE_KEYS_MAP } from '@/lib/context/exchangeContext/localStorageKeys';

type CollapsedMap = Record<string, string[]>;
type ConsoleDisplayMap = {
  version: 1;
  cards: Record<
    string,
    {
      namespaces: CollapsedMap;
    }
  >;
};

type JsonInspectorStorageOptions = {
  storageKey?: string;
  cardId?: string;
  debounceMs?: number;
};

function parseStorageValue(raw: string | null): unknown {
  if (!raw) return null;
  return JSON.parse(raw);
}

function readCollapsedKeys(raw: string | null, namespace: string, cardId?: string): string[] {
  const parsed = parseStorageValue(raw);
  if (!parsed || typeof parsed !== 'object') return [];

  if (cardId) {
    const consoleDisplay = parsed as Partial<ConsoleDisplayMap>;
    const keys = consoleDisplay.cards?.[cardId]?.namespaces?.[namespace];
    return Array.isArray(keys) ? keys : [];
  }

  const keys = (parsed as CollapsedMap)[namespace];
  return Array.isArray(keys) ? keys : [];
}

function writeCollapsedKeys(raw: string | null, namespace: string, keys: string[], cardId?: string) {
  const parsed = parseStorageValue(raw);

  if (cardId) {
    const existing =
      parsed && typeof parsed === 'object'
        ? (parsed as Partial<ConsoleDisplayMap>)
        : {};
    const cards = existing.cards && typeof existing.cards === 'object' ? existing.cards : {};
    const card = cards[cardId] ?? { namespaces: {} };
    cards[cardId] = {
      ...card,
      namespaces: {
        ...(card.namespaces ?? {}),
        [namespace]: keys,
      },
    };
    return JSON.stringify({ version: 1, cards });
  }

  const collapsedMap: CollapsedMap =
    parsed && typeof parsed === 'object' ? (parsed as CollapsedMap) : {};
  collapsedMap[namespace] = keys;
  return JSON.stringify(collapsedMap);
}

export function useJsonInspector(namespace: string, options: JsonInspectorStorageOptions = {}) {
  const storageKey = options.storageKey ?? COLLAPSE_KEYS_MAP;
  const cardId = options.cardId;
  const debounceMs = options.debounceMs ?? 150;
  const [collapsedKeys, setCollapsedKeys] = useState<string[]>([]);
  const hydratedRef = useRef(false);
  const skipNextPersistRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    hydratedRef.current = false;
    skipNextPersistRef.current = true;
    try {
      const raw = window.localStorage.getItem(storageKey);
      setCollapsedKeys(readCollapsedKeys(raw, namespace, cardId));
    } catch (err) {
      console.warn('Failed to load collapsedKeys:', err);
    } finally {
      hydratedRef.current = true;
    }
  }, [cardId, namespace, storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!hydratedRef.current) return;
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(storageKey);
        window.localStorage.setItem(storageKey, writeCollapsedKeys(raw, namespace, collapsedKeys, cardId));
      } catch (err) {
        console.warn('Failed to persist collapsedKeys:', err);
      }
    }, debounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [cardId, collapsedKeys, debounceMs, namespace, storageKey]);

  const updateCollapsedKeys = useCallback((next: string[]) => {
    setCollapsedKeys(next);
  }, []);

  const reset = useCallback(() => {
    setCollapsedKeys([]);
  }, []);

  return { collapsedKeys, updateCollapsedKeys, reset };
}
