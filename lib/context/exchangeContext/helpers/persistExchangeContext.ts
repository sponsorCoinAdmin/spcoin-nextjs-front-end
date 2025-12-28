'use client';

// File: @/lib/context/exchangeContext/helpers/persistExchangeContext.ts

import type { ExchangeContext } from '@/lib/structure';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { EXCHANGE_CONTEXT_LS_KEY } from '@/lib/context/exchangeContext/localStorageKeys';

// ✅ for readable names
import { panelName } from '@/lib/context/exchangeContext/panelTree/panelTreePersistence';
import type { SP_COIN_DISPLAY } from '@/lib/structure';

const LOG_TIME_PERSIST = false;
const DEBUG_ENABLED_PERSIST =
  process.env.NEXT_PUBLIC_DEBUG_LOG_PERSIST_EXCHANGE_CONTEXT === 'true';

// 🔎 Trace toggle (renamed in-code; keeps env var for compatibility)
const TRACE_DISPLAYSTACK_PERSIST =
  process.env.NEXT_PUBLIC_TRACE_BRANCHSTACK === 'true';

const debugPersist = createDebugLogger(
  'PersistExchangeContext',
  DEBUG_ENABLED_PERSIST,
  LOG_TIME_PERSIST,
);

function getByPath(obj: any, path: string): any {
  if (!obj) return undefined;
  if (!path) return obj;
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

function describePanelVisibility(
  prevPanels: any[],
  nextPanels: any[],
): {
  hasPanelVisibilityChange: boolean;
  diffSummary: string;
  visibleNow: string;
} {
  const prevMap = new Map<number, boolean>();
  const nextMap = new Map<number, boolean>();
  const nameMap = new Map<number, string | undefined>();

  for (const p of prevPanels ?? []) {
    if (!p) continue;
    prevMap.set(p.panel, !!p.visible);
    nameMap.set(p.panel, p.name);
  }
  for (const p of nextPanels ?? []) {
    if (!p) continue;
    nextMap.set(p.panel, !!p.visible);
    nameMap.set(p.panel, p.name);
  }

  const allIds = new Set<number>();
  for (const id of prevMap.keys()) allIds.add(id);
  for (const id of nextMap.keys()) allIds.add(id);

  const changes: string[] = [];
  const visibleNames: string[] = [];

  for (const id of allIds) {
    const prevVis = prevMap.get(id);
    const nextVis = nextMap.get(id);
    if (prevVis !== nextVis) {
      const label = nameMap.get(id) ?? String(id);
      changes.push(`${label} ${prevVis ?? 'undefined'} → ${nextVis}`);
    }
  }

  for (const [id, vis] of nextMap.entries()) {
    if (!vis) continue;
    const label = nameMap.get(id) ?? String(id);
    visibleNames.push(label);
  }

  return {
    hasPanelVisibilityChange: changes.length > 0,
    diffSummary: changes.join(', '),
    visibleNow: visibleNames.join('.'),
  };
}

/* -------------------- Option A: displayStack as readable nodes -------------------- */

type DISPLAY_STACK_NODE = {
  id: SP_COIN_DISPLAY; // authoritative
  name: string; // derived (non-authoritative)
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object';
}

function toNode(idNum: number, nameMaybe?: unknown): DISPLAY_STACK_NODE {
  const id = idNum as SP_COIN_DISPLAY;
  const name =
    typeof nameMaybe === 'string' && nameMaybe.trim().length
      ? nameMaybe
      : panelName(idNum as any);
  return { id, name };
}

function normalizeDisplayStackNodes(arr: unknown): DISPLAY_STACK_NODE[] {
  if (!Array.isArray(arr)) return [];
  const out: DISPLAY_STACK_NODE[] = [];

  for (const it of arr as any[]) {
    // tolerate ids-only arrays
    if (typeof it === 'number' || typeof it === 'string') {
      const id = Number(it);
      if (!Number.isFinite(id)) continue;
      out.push(toNode(id));
      continue;
    }

    if (!isRecord(it)) continue;

    // { id, name }
    if ('id' in it) {
      const id = Number((it as any).id);
      if (!Number.isFinite(id)) continue;
      out.push(toNode(id, (it as any).name));
      continue;
    }

    // tolerate legacy mirror shape if it still shows up somewhere
    if ('displayTypeId' in it) {
      const id = Number((it as any).displayTypeId);
      if (!Number.isFinite(id)) continue;
      out.push(toNode(id, (it as any).displayTypeName));
      continue;
    }
  }

  return out;
}

/**
 * Ensures LS persistence uses ONLY:
 *   settings.displayStack: DISPLAY_STACK_NODE[]
 *
 */
function ensureReadableDisplayStack(next: ExchangeContext): ExchangeContext {
  const settings: any = (next as any)?.settings;
  if (!settings) return next;

  const finalNodes = normalizeDisplayStackNodes(settings.displayStack);

  settings.displayStack = finalNodes;

  if (DEBUG_ENABLED_PERSIST) {
    // eslint-disable-next-line no-console
    console.log('[PersistExchangeContext] normalized displayStack', {
      displayStack: finalNodes,
      ids: finalNodes.map((n) => Number(n.id)),
    });
  }

  return next;
}

function safeJsonParse(s: string | null) {
  if (!s) return undefined;
  try {
    return JSON.parse(s);
  } catch {
    return { __parseError: true, raw: s.slice(0, 500) };
  }
}

function lsPeek(key: string) {
  try {
    if (typeof window === 'undefined') return undefined;
    return safeJsonParse(window.localStorage.getItem(key));
  } catch (e) {
    return { __lsError: true, key, error: String(e) };
  }
}

export function persistWithOptDiff(
  prev: ExchangeContext | undefined,
  next: ExchangeContext,
  panelPathKey: string,
): void {
  if (typeof window === 'undefined') {
    // SSR / RSC safety: never touch localStorage on the server.
    return;
  }

  const isFirstPersist = !prev;

  const prevPanels = Array.isArray(getByPath(prev as any, panelPathKey))
    ? (getByPath(prev as any, panelPathKey) as any[])
    : [];
  const nextPanels = Array.isArray(getByPath(next as any, panelPathKey))
    ? (getByPath(next as any, panelPathKey) as any[])
    : [];

  const { hasPanelVisibilityChange, diffSummary, visibleNow } =
    describePanelVisibility(prevPanels, nextPanels);

  const prevTradeData = (prev as any)?.tradeData;
  const nextTradeData = (next as any)?.tradeData;

  const sameTradeData =
    stringifyBigInt(prevTradeData) === stringifyBigInt(nextTradeData);

  debugPersist.log?.('🧾 Persist (with diff)', {
    isFirstPersist,
    hasPanelVisibilityChange,
    sameTradeData,
  });

  if (hasPanelVisibilityChange) {
    debugPersist.log?.('ExchangeContext Local Storage Update (diff snapshot)', {
      panelPathKey,
      diffSummary,
      visibleNow,
      tradeDataPrev: prevTradeData,
      tradeDataNext: nextTradeData,
    });
  }

  try {
    const coerced = ensureReadableDisplayStack(next);

    if (DEBUG_ENABLED_PERSIST) {
      debugPersist.log?.('[PersistExchangeContext] settings snapshot', {
        displayStack: (coerced as any)?.settings?.displayStack,
      });
    }

    const serialized = stringifyBigInt(coerced);
    window.localStorage.setItem(EXCHANGE_CONTEXT_LS_KEY, serialized);

    if (TRACE_DISPLAYSTACK_PERSIST) {
      // eslint-disable-next-line no-console
      console.log('[TRACE][PersistExchangeContext] LS readback', {
        key: EXCHANGE_CONTEXT_LS_KEY,
        stored: lsPeek(EXCHANGE_CONTEXT_LS_KEY),
      });
    }
  } catch (err) {
    debugPersist.error?.('persistWithOptDiff: localStorage setItem failed', err);
  }
}
