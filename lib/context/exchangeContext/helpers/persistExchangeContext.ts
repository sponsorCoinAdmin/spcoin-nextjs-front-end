// File: @/lib/context/exchangeContext/helpers/persistExchangeContext.ts
'use client';

import type { ExchangeContext as ExchangeContextTypeOnly } from '@/lib/structure';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { saveLocalExchangeContext } from '@/lib/context/helpers/saveLocalExchangeContext';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_PROVIDER === 'true';

const debugLog = createDebugLogger(
  'PersistExchangeContext',
  DEBUG_ENABLED,
  LOG_TIME,
);

type FlatPanelLite = { panel: number; name?: string; visible?: boolean };

const panelName = (id: number) => SP_COIN_DISPLAY[id] ?? String(id);

/* ─────────────────────── panel visibility helpers ─────────────────────── */

const makeVisMap = (panels?: FlatPanelLite[]) => {
  const m: Record<number, boolean> = {};
  if (!Array.isArray(panels)) return m;
  for (const p of panels) {
    if (typeof p?.panel === 'number') {
      m[p.panel] = !!p.visible;
    }
  }
  return m;
};

const diffPanelVisibility = (
  prev?: FlatPanelLite[],
  next?: FlatPanelLite[],
) => {
  const a = makeVisMap(prev);
  const b = makeVisMap(next);
  const ids = new Set<number>(
    [...Object.keys(a), ...Object.keys(b)].map(Number),
  );
  const changes: Array<{
    id: number;
    before: boolean | undefined;
    after: boolean | undefined;
  }> = [];
  ids.forEach((id) => {
    const before = a[id];
    const after = b[id];
    if (before !== after) {
      changes.push({ id, before, after });
    }
  });
  return changes;
};

const visiblePanelsValue = (panels?: FlatPanelLite[]) => {
  if (!Array.isArray(panels)) return '(none)';
  const names = panels
    .filter((p) => !!p?.visible)
    .map((p) => p?.name || panelName(p.panel));
  return names.length ? names.join('.') : '(none)';
};

/* ─────────────────────── tradeData diff helpers ─────────────────────── */

type TradeDataFingerprint = {
  tradeDirection: number | null;
  sellAddress: string | null;
  buyAddress: string | null;
  rateRatio: number | null;
  slippageBps: number | null;
};

/** Extract a small, JSON-safe summary of tradeData that we can diff. */
function fingerprintTradeData(ctx: ExchangeContextTypeOnly | undefined): TradeDataFingerprint {
  const td: any = (ctx as any)?.tradeData ?? {};
  const sell = td.sellTokenContract ?? {};
  const buy = td.buyTokenContract ?? {};
  const slippage = td.slippage ?? {};

  return {
    tradeDirection:
      typeof td.tradeDirection === 'number' ? td.tradeDirection : null,
    sellAddress:
      typeof sell.address === 'string' ? sell.address.toLowerCase() : null,
    buyAddress:
      typeof buy.address === 'string' ? buy.address.toLowerCase() : null,
    rateRatio:
      typeof td.rateRatio === 'number' ? td.rateRatio : null,
    slippageBps:
      typeof slippage.bps === 'number' ? slippage.bps : null,
  };
}

function fingerprintsEqual(a: TradeDataFingerprint, b: TradeDataFingerprint): boolean {
  return (
    a.tradeDirection === b.tradeDirection &&
    a.sellAddress === b.sellAddress &&
    a.buyAddress === b.buyAddress &&
    a.rateRatio === b.rateRatio &&
    a.slippageBps === b.slippageBps
  );
}

/* ─────────────────────────── main helper ─────────────────────────── */

/**
 * Persist helper that:
 * - logs a panel-visibility diff when DEBUG is on
 * - includes `tradeData` in the “meaningful change” test
 * - always persists on first call (prevCtx undefined)
 *
 * This ensures:
 *  - trade token changes
 *  - slippage changes
 *  - panel open/closed (spCoinPanelTree.visible) changes
 * all trigger a localStorage save.
 */
export function persistWithOptDiff(
  prevCtx: ExchangeContextTypeOnly | undefined,
  nextCtx: ExchangeContextTypeOnly,
  entityName = 'ExchangeContext.settings.spCoinPanelTree',
) {
  try {
    const prevPanels =
      (prevCtx as any)?.settings?.spCoinPanelTree as
        | FlatPanelLite[]
        | undefined;
    const nextPanels =
      (nextCtx as any)?.settings?.spCoinPanelTree as
        | FlatPanelLite[]
        | undefined;

    const panelChanges = diffPanelVisibility(prevPanels, nextPanels);
    const visibleNow = visiblePanelsValue(nextPanels);
    const hasPanelVisibilityChange = panelChanges.length > 0;

    const prevTradeFp = fingerprintTradeData(prevCtx);
    const nextTradeFp = fingerprintTradeData(nextCtx);
    const sameTradeData = fingerprintsEqual(prevTradeFp, nextTradeFp);

    // First run: always persist
    const isFirstPersist = !prevCtx;

    const shouldPersist =
      isFirstPersist ||
      hasPanelVisibilityChange ||       // open/closed state for panels (spCoinPanelTree)
      !sameTradeData;                   // tradeDirection / tokens / slippage changes

    if (DEBUG_ENABLED) {
      const changeLine =
        panelChanges.length === 0
          ? '(no panel visibility changes)'
          : panelChanges
              .map(
                (c) =>
                  `${panelName(c.id)} ${String(
                    c.before,
                  )} → ${String(c.after)}`,
              )
              .join(', ');

      const msgLines = [
        'ExchangeContext Local Storage Update (diff snapshot)',
        `${entityName}: ${changeLine}`,
        `Visible now: ${visibleNow}.`,
        `tradeData prev: ${JSON.stringify(prevTradeFp)}`,
        `tradeData next: ${JSON.stringify(nextTradeFp)}`,
        `shouldPersist: ${String(shouldPersist)} (isFirstPersist=${String(
          isFirstPersist,
        )}, hasPanelVisibilityChange=${String(
          hasPanelVisibilityChange,
        )}, sameTradeData=${String(sameTradeData)})`,
      ];

      debugLog.log?.('🧾 Persist (with diff)\n' + msgLines.join('\n'));
    }

    if (!shouldPersist) {
      // No meaningful change → skip write
      return;
    }

    // Persist to localStorage
    saveLocalExchangeContext(nextCtx);
  } catch (err) {
    debugLog.error?.('❌ persistWithOptDiff failed:', err);
    // Best effort: still attempt to persist
    try {
      saveLocalExchangeContext(nextCtx);
    } catch {
      // swallow
    }
  }
}
