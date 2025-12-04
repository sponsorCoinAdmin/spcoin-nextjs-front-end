// File: @/app/(menu)/Test/Tabs/ExchangeContext/utils/exCtxMapStorage.ts

import { EXCHANGE_CONTEXT_TREE_DISPLAY_MAP } from '@/lib/context/exchangeContext/localStorageKeys';

export type ExCtxMapStored = {
  version: number;
  paths: Record<string, boolean>;
  shape?: string; // optional shape signature for pruning on schema change
};

const VERSION = 1;

export function loadExCtxMap(): ExCtxMapStored | null {
  try {
    const raw = localStorage.getItem(EXCHANGE_CONTEXT_TREE_DISPLAY_MAP);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExCtxMapStored;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.version !== 'number' || !parsed.paths || typeof parsed.paths !== 'object') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

let saveTimer: number | undefined;

export function saveExCtxMap(paths: Record<string, boolean>, shape?: string) {
  const payload: ExCtxMapStored = { version: VERSION, paths, shape };

  // Debounce writes a bit
  if (saveTimer) {
    window.clearTimeout(saveTimer);
  }
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(EXCHANGE_CONTEXT_TREE_DISPLAY_MAP, JSON.stringify(payload));
    } catch {
      // ignore quota / privacy mode errors
    }
  }, 200);
}

/** Utility to prune a stored map to a set of allowed keys. */
export function filterPaths(
  stored: ExCtxMapStored | null,
  allowed: Set<string>
): Record<string, boolean> {
  if (!stored) return {};
  const next: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(stored.paths)) {
    if (allowed.has(k)) next[k] = !!v;
  }
  return next;
}
