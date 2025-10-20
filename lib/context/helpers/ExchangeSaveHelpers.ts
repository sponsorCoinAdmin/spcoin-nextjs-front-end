// File: lib/context/exchangeContext/helpers/ExchangeSaveHelpers.ts
import { ExchangeContext } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/registry/panelRegistry';

const STORAGE_KEY = 'exchangeContext';
const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_HELPER === 'true';
const debugLog = createDebugLogger('ExchangeSaveHelpers', DEBUG_ENABLED, LOG_TIME);

/** Ensure exactly one MAIN_OVERLAY_GROUP panel is visible; if none, pick TRADING_STATION_PANEL. */
function normalizeOverlayVisibility(
  flat: Array<{ panel: SP_COIN_DISPLAY; visible: boolean }>,
  fallback: SP_COIN_DISPLAY
) {
  const firstVisible = flat.find(p => MAIN_OVERLAY_GROUP.includes(p.panel) && p.visible)?.panel ?? fallback;
  for (const p of flat) {
    if (MAIN_OVERLAY_GROUP.includes(p.panel)) {
      p.visible = (p.panel === firstVisible);
    }
  }
}

export function saveLocalExchangeContext(ctx: ExchangeContext) {
  try {
    // Clone to avoid mutating live state
    const out: any = typeof structuredClone === 'function' ? structuredClone(ctx) : JSON.parse(JSON.stringify(ctx));

    // Settings container
    out.settings = { ...(out.settings ?? {}) };

    // 1) Never persist legacy/derived fields
    if ('mainPanelNode' in out.settings) {
      delete out.settings.mainPanelNode;
      debugLog.log('🧹 Removed settings.mainPanelNode before save');
    }

    // 2) Coerce and sanitize spCoinPanelTree
    const rawTree: any[] = Array.isArray(out.settings.spCoinPanelTree) ? out.settings.spCoinPanelTree : [];
    const flatTree: Array<{ panel: SP_COIN_DISPLAY; visible: boolean; name?: string }> = rawTree
      .filter(n => n && typeof n.panel === 'number')
      .map(n => ({
        panel: n.panel as SP_COIN_DISPLAY,
        visible: !!n.visible,
        name: typeof n.name === 'string' ? n.name : undefined,
      }))
      // Never persist these
      .filter(n =>
        n.panel !== SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL &&
        n.panel !== SP_COIN_DISPLAY.UNDEFINED
      );

    // 3) Normalize overlays to avoid multi-select bugs in storage
    normalizeOverlayVisibility(flatTree, SP_COIN_DISPLAY.TRADING_STATION_PANEL);

    // 4) Write back sanitized tree and bump schema
    out.settings.spCoinPanelTree = flatTree;
    out.settings.spCoinPanelSchemaVersion = Math.max(3, Number(out.settings.spCoinPanelSchemaVersion ?? 0));

    const serialized = JSON.stringify(out);
    localStorage.setItem(STORAGE_KEY, serialized);
    debugLog.log('💾 Saved ExchangeContext to localStorage:', serialized);
  } catch (err) {
    debugLog.error(`⛔ Failed to save exchangeContext: ${err instanceof Error ? err.message : String(err)}`);
    // Do not throw; saving should be best-effort
  }
}
