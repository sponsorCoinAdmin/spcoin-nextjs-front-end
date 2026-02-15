// File: app/(menu)/Test/Tabs/ExchangeContext/utils/exCtxMapStorage.ts
'use client';

import { EXCHANGE_CONTEXT_TREE_DISPLAY_MAP } from '@/lib/context/exchangeContext/localStorageKeys';
import { createDebugLogger } from '@/lib/utils/debugLogger';

export type ExCtxMapStored = {
  version: number;
  paths: Record<string, boolean>;
  shape?: string; // optional shape signature for pruning on schema change
};

const VERSION = 1;

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_EX_CTX_MAP === 'true';
const debugLog = createDebugLogger(
  'exCtxMapStorage',
  DEBUG_ENABLED,
  LOG_TIME,
);

export function loadExCtxMap(): ExCtxMapStored | null {
  try {
    const raw = localStorage.getItem(EXCHANGE_CONTEXT_TREE_DISPLAY_MAP);
    debugLog.log?.('loadExCtxMap: raw from LS', {
      key: EXCHANGE_CONTEXT_TREE_DISPLAY_MAP,
      hasValue: !!raw,
      size: raw?.length ?? 0,
      head: raw?.slice(0, 160) ?? null,
    });

    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExCtxMapStored;
    if (!parsed || typeof parsed !== 'object') {
      debugLog.warn?.('loadExCtxMap: parsed value is not an object', parsed);
      return null;
    }
    if (
      typeof parsed.version !== 'number' ||
      !parsed.paths ||
      typeof parsed.paths !== 'object'
    ) {
      debugLog.warn?.('loadExCtxMap: invalid shape', parsed);
      return null;
    }

    debugLog.log?.('loadExCtxMap: parsed', parsed);
    return parsed;
  } catch (err) {
    debugLog.error?.('loadExCtxMap: error parsing LS value', err);
    return null;
  }
}

let saveTimer: number | undefined;

export function saveExCtxMap(paths: Record<string, boolean>, shape?: string) {
  const payload: ExCtxMapStored = { version: VERSION, paths, shape };

  debugLog.log?.('saveExCtxMap: scheduling save', {
    key: EXCHANGE_CONTEXT_TREE_DISPLAY_MAP,
    payload,
  });

  // Debounce writes a bit
  if (saveTimer) {
    window.clearTimeout(saveTimer);
  }
  saveTimer = window.setTimeout(() => {
    try {
      const serialized = JSON.stringify(payload);
      localStorage.setItem(EXCHANGE_CONTEXT_TREE_DISPLAY_MAP, serialized);
      debugLog.log?.('saveExCtxMap: wrote to LS', {
        key: EXCHANGE_CONTEXT_TREE_DISPLAY_MAP,
        size: serialized.length,
        head: serialized.slice(0, 160),
      });
    } catch (err) {
      // ignore quota / privacy mode errors, but log if debugging
      debugLog.error?.('saveExCtxMap: failed to write LS', err);
    }
  }, 200);
}

/** Utility to prune a stored map to a set of allowed keys. */
export function filterPaths(
  stored: ExCtxMapStored | null,
  allowed: Set<string>
): Record<string, boolean> {
  if (!stored) {
    debugLog.log?.('filterPaths: no stored map, returning empty');
    return {};
  }

  const next: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(stored.paths)) {
    if (allowed.has(k)) next[k] = !!v;
  }

  debugLog.log?.('filterPaths: result after prune', {
    allowedCount: allowed.size,
    storedCount: Object.keys(stored.paths).length,
    resultCount: Object.keys(next).length,
    sample: Object.entries(next).slice(0, 10),
  });

  return next;
}
