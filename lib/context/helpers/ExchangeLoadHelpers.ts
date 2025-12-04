// File: @/lib/context/exchangeContext/helpers/ExchangeLoadHelpers.ts
import { CHAIN_ID, SP_COIN_DISPLAY } from '@/lib/structure';
import type { ExchangeContext } from '@/lib/structure';
import { deserializeWithBigInt } from '@/lib/utils/jsonBigInt';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { sanitizeExchangeContext } from './ExchangeSanitizeHelpers';
import { MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/registry/panelRegistry';

const EXCHANGE_CONTEXT_TREE_DISPLAY_MAP = 'exchangeContext';
const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_HELPER === 'true';
const debugLog = createDebugLogger('ExchangeLoadHelpers', DEBUG_ENABLED, LOG_TIME);

/** Ensure exactly one MAIN_OVERLAY_GROUP panel is visible; if none, use fallback. */
function normalizeOverlayVisibility(
  flat: Array<{ panel: SP_COIN_DISPLAY; visible: boolean }>,
  fallback: SP_COIN_DISPLAY
): void {
  const alreadyVisible = flat.filter((p) => MAIN_OVERLAY_GROUP.includes(p.panel) && p.visible);
  const chosen = alreadyVisible.length > 0 ? alreadyVisible[0].panel : fallback;
  for (const p of flat) {
    if (MAIN_OVERLAY_GROUP.includes(p.panel)) {
      p.visible = p.panel === chosen;
    }
  }
}

export function loadLocalExchangeContext(): ExchangeContext | null {
  try {
    const serializedContext = localStorage.getItem(EXCHANGE_CONTEXT_TREE_DISPLAY_MAP);

    if (!serializedContext) {
      debugLog.warn(`\u26A0\uFE0F NO LOADED EXCHANGE CONTEXT FOUND FOR KEY\n${EXCHANGE_CONTEXT_TREE_DISPLAY_MAP}`);
      return null;
    }

    debugLog.log(
      '\ud83d\udd13 LOADED EXCHANGE CONTEXT FROM LOCALSTORAGE(serialized)\n:',
      serializedContext
    );

    let parsed: any;
    try {
      parsed = deserializeWithBigInt(serializedContext);
    } catch (parseError) {
      debugLog.error(
        `\u274C Failed to deserializeWithBigInt: ${
          parseError instanceof Error ? parseError.message : String(parseError)
        }`
      );
      return null;
    }

    debugLog.log(
      '\u2705 PARSED LOADED EXCHANGE CONTEXT FROM LOCALSTORAGE(parsed)\n:',
      parsed
    );

    try {
      const prettyPrinted = JSON.stringify(
        parsed,
        (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
        2
      );
      debugLog.log(
        '\u2705 (PRETTY PRINT) LOADED EXCHANGE CONTEXT FROM LOCALSTORAGE(parsed)\n:',
        prettyPrinted
      );
    } catch (stringifyError) {
      debugLog.warn('\u26A0\uFE0F Failed to pretty-print parsed ExchangeContext:', stringifyError);
    }

    // --------- Clean up settings, drop legacy fields, and normalize overlays ----------
    const settings: any = parsed?.settings ?? {};

    // Never keep legacy mainPanelNode
    if ('mainPanelNode' in settings) {
      delete settings.mainPanelNode;
      debugLog.log('🧹 Dropped legacy settings.mainPanelNode from loaded context');
    }

    // Coerce tree & strip non-persisted/invalid entries
    const rawTree: any[] = Array.isArray(settings.spCoinPanelTree) ? settings.spCoinPanelTree : [];
    const flatTree: Array<{ panel: SP_COIN_DISPLAY; visible: boolean; name?: string }> = rawTree
      .filter((n) => n && typeof n.panel === 'number')
      .map((n) => ({
        panel: n.panel as SP_COIN_DISPLAY,
        visible: !!n.visible,
        name: typeof n.name === 'string' ? n.name : undefined,
      }))
      .filter(
        (n) =>
          n.panel !== SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL &&
          n.panel !== SP_COIN_DISPLAY.UNDEFINED
      );

    // Normalize radio overlays, preserving the saved choice if present
    normalizeOverlayVisibility(flatTree, SP_COIN_DISPLAY.TRADING_STATION_PANEL);

    // Reassign cleaned settings, optionally bump schema
    settings.spCoinPanelTree = flatTree;
    settings.spCoinPanelSchemaVersion = Math.max(
      3,
      Number(settings.spCoinPanelSchemaVersion ?? 0)
    );

    parsed.settings = settings;
    // ----------------------------------------------------------------------

    const chainId = parsed.network?.chainId ?? CHAIN_ID.ETHEREUM;
    return sanitizeExchangeContext(parsed, chainId);
  } catch (error) {
    debugLog.error(
      `\u26D4\uFE0F Failed to load exchangeContext: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return null;
  }
}
