// File: lib/context/exchangeContext/helpers/persistExchangeContext.ts
'use client';

import type { ExchangeContext as ExchangeContextTypeOnly } from '@/lib/structure';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { saveLocalExchangeContext } from './ExchangeSaveHelpers';

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

/**
 * Persist helper that only uses the verbose diff+alert path when
 * NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_PROVIDER === 'true'.
 */
export function persistWithOptDiff(
  prevCtx: ExchangeContextTypeOnly | undefined,
  nextCtx: ExchangeContextTypeOnly,
  entityName = 'ExchangeContext.settings.spCoinPanelTree',
) {
  try {
    if (DEBUG_ENABLED) {
      const prevPanels =
        (prevCtx as any)?.settings?.spCoinPanelTree as
          | FlatPanelLite[]
          | undefined;
      const nextPanels =
        (nextCtx as any)?.settings?.spCoinPanelTree as
          | FlatPanelLite[]
          | undefined;

      const changes = diffPanelVisibility(prevPanels, nextPanels);
      const visibleNow = visiblePanelsValue(nextPanels);

      const changeLine =
        changes.length === 0
          ? '(no panel visibility changes)'
          : changes
              .map(
                (c) =>
                  `${panelName(c.id)} ${String(
                    c.before,
                  )} → ${String(c.after)}`,
              )
              .join(', ');

      const msgStr =
        `ExchangeContext Local Storage Update\n` +
        `${entityName}: ${changeLine}\n` +
        `Visible now: ${visibleNow}.`;

      // 1) Alert for immediate visibility (debug only)
      // eslint-disable-next-line no-alert
      alert(msgStr);

      // 2) Console for traceability (debug only)
      // eslint-disable-next-line no-console
      console.log(msgStr);

      debugLog.log?.('🧾 Persist (with diff)\n' + msgStr);
    }

    // Always persist to localStorage (silent when DEBUG off)
    saveLocalExchangeContext(nextCtx);
  } catch (err) {
    debugLog.error?.('❌ persistWithOptDiff failed:', err);
    // Best effort: still attempt to persist
    try {
      saveLocalExchangeContext(nextCtx);
    } catch {}
  }
}
