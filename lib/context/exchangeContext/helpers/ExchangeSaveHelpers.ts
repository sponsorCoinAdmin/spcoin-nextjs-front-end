// File: @/lib/context/exchangeContext/helpers/ExchangeSaveHelpers.ts
'use client';

import type { ExchangeContext as ExchangeContextTypeOnly } from '@/lib/structure';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
// 🔑 LocalStorage key (keep in sync with loader)
import { EXCHANGE_CONTEXT_LS_KEY } from '@/lib/context/exchangeContext/constants';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_PROVIDER === 'true';

const debugLog = createDebugLogger(
  'ExchangeSaveHelpers',
  DEBUG_ENABLED,
  LOG_TIME,
);

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

type FlatPanelLite = { panel: number; name?: string; visible?: boolean };

const panelName = (id: number) => SP_COIN_DISPLAY[id] ?? String(id);

const visiblePanelsValue = (panels?: FlatPanelLite[]) => {
  if (!Array.isArray(panels)) return '(none)';
  const names = panels
    .filter((p) => !!p?.visible)
    .map((p) => p?.name || panelName(p.panel));
  return names.length ? names.join('.') : '(none)';
};

const chosenOverlayLabel = (panels?: FlatPanelLite[]) => {
  if (!Array.isArray(panels)) return '(none)';
  const visible = panels.filter((p) => p.visible);
  if (!visible.length) return '(none)';
  // Prefer TRADING_STATION_PANEL if it’s visible, else the first visible
  const trading = visible.find(
    (p) => p.panel === SP_COIN_DISPLAY.TRADING_STATION_PANEL,
  );
  const chosen = trading ?? visible[0];
  return chosen?.name || panelName(chosen.panel);
};

/* -------------------------------------------------------------------------- */
/*                          Save / Read-back verification                     */
/* -------------------------------------------------------------------------- */

export function saveLocalExchangeContext(next: ExchangeContextTypeOnly) {
  try {
    // Shallow clone so we can strip / tweak before saving
    const toPersist: any =
      typeof structuredClone === 'function'
        ? structuredClone(next)
        : JSON.parse(JSON.stringify(next));

    // 🧹 Do not persist runtime-only mainPanelNode (radio state)
    if (toPersist?.settings?.mainPanelNode) {
      debugLog.log?.('🧹 Removed settings.mainPanelNode before save');
      delete toPersist.settings.mainPanelNode;
    }

    const flatPanels =
      (toPersist?.settings?.spCoinPanelTree as FlatPanelLite[] | undefined) ??
      [];

    const overlay = chosenOverlayLabel(flatPanels);
    const visibleNow = visiblePanelsValue(flatPanels);

    debugLog.log?.('💾 Saving ExchangeContext → localStorage');
    debugLog.log?.(`• Overlay chosen: ${overlay}`);
    debugLog.log?.(
      `• Visible (pre-normalize snapshot): ${visibleNow}.`,
    );

    const json = JSON.stringify(toPersist);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(EXCHANGE_CONTEXT_LS_KEY, json);
    }

    // ✅ Optional read-back verification
    try {
      if (typeof window === 'undefined') return;

      const stored = window.localStorage.getItem(EXCHANGE_CONTEXT_LS_KEY);
      if (!stored) {
        debugLog.warn?.('⚠️ Read-back: no value found after save');
        return;
      }

      const parsed = JSON.parse(stored);
      const persistedPanels =
        (parsed?.settings?.spCoinPanelTree as FlatPanelLite[] | undefined) ??
        [];
      const persistedVisible = visiblePanelsValue(persistedPanels);

      debugLog.log?.('✅ Read-back verification');
      debugLog.log?.(
        `• Visible panels persisted: ${persistedVisible}.`,
      );
    } catch (e) {
      debugLog.warn?.('⚠️ Read-back verification failed', e);
    }
  } catch (err) {
    debugLog.error?.('❌ saveLocalExchangeContext failed', err);
  }
}
