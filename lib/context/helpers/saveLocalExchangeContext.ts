import { CHAIN_ID, ExchangeContext } from '@/lib/structure';
import { deserializeWithBigInt } from '@/lib/utils/jsonBigInt';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { sanitizeExchangeContext } from './ExchangeSanitizeHelpers';
import { SP_COIN_DISPLAY } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';
import { MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/registry/panelRegistry';

const STORAGE_KEY = 'exchangeContext';
const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_HELPER === 'true';
const debugLog = createDebugLogger('ExchangeLoadHelpers', DEBUG_ENABLED, LOG_TIME);

/** Normalize: exactly one overlay in MAIN_OVERLAY_GROUP is visible.
 * If none are visible, fall back to TRADING_STATION_PANEL.
 */
function normalizeOverlayVisibility(
  flat: Array<{ panel: SP_COIN_DISPLAY; visible: boolean }>,
  fallback: SP_COIN_DISPLAY
) {
  // Keep the first already-visible overlay if any; otherwise choose fallback.
  const firstVisible = flat.find(p => MAIN_OVERLAY_GROUP.includes(p.panel) && p.visible)?.panel ?? fallback;
  for (const p of flat) {
    if (MAIN_OVERLAY_GROUP.includes(p.panel)) p.visible = (p.panel === firstVisible);
  }
}

export function loadLocalExchangeContext(): ExchangeContext | null {
  try {
    const serializedContext = localStorage.getItem(STORAGE_KEY);

    if (!serializedContext) {
      debugLog.warn(`\u26A0\uFE0F NO LOADED EXCHANGE CONTEXT FOUND FOR KEY\n${STORAGE_KEY}`);
      return null;
    }

    debugLog.log('\ud83d\udd13 LOADED EXCHANGE CONTEXT FROM LOCALSTORAGE(serialized)\n:', serializedContext);

    let parsed: any;
    try {
      parsed = deserializeWithBigInt(serializedContext);
    } catch (parseError) {
      debugLog.error(`\u274C Failed to deserializeWithBigInt: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      console.error(parseError);
      return null;
    }

    debugLog.log('\u2705 PARSED LOADED EXCHANGE CONTEXT FROM LOCALSTORAGE(parsed)\n:', parsed);

    try {
      const prettyPrinted = JSON.stringify(
        parsed,
        (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
        2
      );
      debugLog.log('\u2705 (PRETTY PRINT) LOADED EXCHANGE CONTEXT FROM LOCALSTORAGE(parsed)\n:', prettyPrinted);
    } catch (stringifyError) {
      debugLog.warn('\u26A0\uFE0F Failed to pretty-print parsed ExchangeContext:', stringifyError);
    }

    // ---- Fixes begin: remove mainPanelNode, sanitize spCoinPanelTree, normalize overlays ----
    const settings: any = parsed?.settings ?? {};

    // 1) Drop legacy/unused structure
    if ('mainPanelNode' in settings) {
      delete settings.mainPanelNode;
      debugLog.log('🧹 Dropped legacy settings.mainPanelNode from loaded context');
    }

    // 2) Ensure tree array exists and coerce shape
    const rawTree: any[] = Array.isArray(settings.spCoinPanelTree) ? settings.spCoinPanelTree : [];
    const flatTree: Array<{ panel: SP_COIN_DISPLAY; visible: boolean; name?: string }> = rawTree
      .filter(n => n && typeof n.panel === 'number')
      .map(n => ({
        panel: n.panel as SP_COIN_DISPLAY,
        visible: !!n.visible,
        name: typeof n.name === 'string' ? n.name : undefined,
      }))
      // 3) Never persist these IDs
      .filter(n => n.panel !== SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL && n.panel !== SP_COIN_DISPLAY.UNDEFINED);

    // 4) Normalize radio overlays: keep the saved choice; if none, fallback to TRADING_STATION_PANEL
    normalizeOverlayVisibility(flatTree, SP_COIN_DISPLAY.TRADING_STATION_PANEL);

    // 5) Reassign cleaned settings and bump schema (optional)
    settings.spCoinPanelTree = flatTree;
    settings.spCoinPanelSchemaVersion = Math.max(3, Number(settings.spCoinPanelSchemaVersion ?? 0));

    parsed.settings = settings;
    // ---- Fixes end ----

    const chainId = parsed.network?.chainId ?? CHAIN_ID.ETHEREUM;
    return sanitizeExchangeContext(parsed, chainId);
  } catch (error) {
    debugLog.error(`\u26D4\uFE0F Failed to load exchangeContext: ${error instanceof Error ? error.message : String(error)}`);
    console.error(error);
    return null;
  }
}
