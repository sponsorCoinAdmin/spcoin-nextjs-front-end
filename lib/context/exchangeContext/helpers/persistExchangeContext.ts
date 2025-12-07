'use client';

// File: @/lib/context/exchangeContext/helpers/persistExchangeContext.ts

import type { ExchangeContext } from '@/lib/structure';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { EXCHANGE_CONTEXT_LS_KEY } from '@/lib/context/exchangeContext/localStorageKeys';

const LOG_TIME_PERSIST = false;
const DEBUG_ENABLED_PERSIST =
  process.env.NEXT_PUBLIC_DEBUG_LOG_PERSIST_EXCHANGE_CONTEXT === 'true';

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

  const {
    hasPanelVisibilityChange,
    diffSummary,
    visibleNow,
  } = describePanelVisibility(prevPanels, nextPanels);

  const prevTradeData = (prev as any)?.tradeData;
  const nextTradeData = (next as any)?.tradeData;

  // Use stringifyBigInt to safely compare structures that may contain bigint
  const sameTradeData =
    stringifyBigInt(prevTradeData) === stringifyBigInt(nextTradeData);

  // For diagnostics only — we ALWAYS persist when state has changed at the
  // ExchangeProvider level (prevStr !== nextStr).
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
    const serialized = stringifyBigInt(next);
    window.localStorage.setItem(EXCHANGE_CONTEXT_LS_KEY, serialized);
  } catch (err) {
    debugPersist.error?.('persistWithOptDiff: localStorage setItem failed', err);
  }
}
