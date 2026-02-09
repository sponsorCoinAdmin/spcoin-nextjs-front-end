// File: @/lib/context/exchangeContext/helpers/ExchangeLoadHelpers.ts
import { CHAIN_ID, SP_COIN_DISPLAY } from '@/lib/structure';
import type { ExchangeContext } from '@/lib/structure';
import { deserializeWithBigInt } from '@/lib/utils/jsonBigInt';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { sanitizeExchangeContext } from './ExchangeSanitizeHelpers';
import { MAIN_RADIO_OVERLAY_PANELS } from '@/lib/structure/exchangeContext/registry/panelRegistry';
import { panelName } from '@/lib/context/exchangeContext/panelTree/panelTreePersistence';

const EXCHANGE_CONTEXT_TREE_DISPLAY_MAP = 'exchangeContext';
const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_HELPER === 'true';
const debugLog = createDebugLogger('ExchangeLoadHelpers', DEBUG_ENABLED, LOG_TIME);

/** Normalize MAIN_RADIO_OVERLAY_PANELS visibility:
 *  - If 0 overlays visible: do nothing (allow empty)
 *  - If 1 overlay visible: do nothing
 *  - If >1 overlays visible: collapse to the first visible (stable)
 */
function normalizeOverlayVisibility(
  flat: Array<{ panel: SP_COIN_DISPLAY; visible: boolean }>,
): void {
  const overlays = flat.filter((p) => MAIN_RADIO_OVERLAY_PANELS.includes(p.panel));
  const visible = overlays.filter((p) => p.visible);

  if (DEBUG_ENABLED) {
    debugLog.log?.('[normalizeOverlayVisibility] before', {
      overlayCount: overlays.length,
      visibleCount: visible.length,
      visible: visible.map((v) => SP_COIN_DISPLAY[v.panel] ?? v.panel),
    });
  }

  // ✅ Allow empty overlay selection
  if (visible.length <= 1) return;

  const chosen = visible[0]!.panel;

  for (const p of flat) {
    if (MAIN_RADIO_OVERLAY_PANELS.includes(p.panel)) {
      p.visible = p.panel === chosen;
    }
  }

  if (DEBUG_ENABLED) {
    debugLog.log?.('[normalizeOverlayVisibility] after', {
      chosen: SP_COIN_DISPLAY[chosen] ?? chosen,
    });
  }
}

/* -------------------- displayStack normalization -------------------- */

type DISPLAY_STACK_NODE = { id: SP_COIN_DISPLAY; name: string };
const LEGACY_BUY_LIST_NAME = 'BUY_LIST_SELECT_PANEL';
const mapLegacyPanelId = (id: number): number =>
  SP_COIN_DISPLAY[id as SP_COIN_DISPLAY] === LEGACY_BUY_LIST_NAME
    ? SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL
    : id;

function normalizeDisplayStackNodes(raw: unknown): DISPLAY_STACK_NODE[] {
  if (!Array.isArray(raw)) return [];
  const out: DISPLAY_STACK_NODE[] = [];

  for (const it of raw as any[]) {
    // tolerate ids-only
    if (typeof it === 'number' || typeof it === 'string') {
      const id = mapLegacyPanelId(Number(it));
      if (!Number.isFinite(id)) continue;
      out.push({ id: id as SP_COIN_DISPLAY, name: panelName(id as any) });
      continue;
    }

    if (!it || typeof it !== 'object') continue;

    if ('id' in it) {
      const id = mapLegacyPanelId(Number((it as any).id));
      if (!Number.isFinite(id)) continue;
      const name =
        typeof (it as any).name === 'string' && String((it as any).name).trim().length
          ? String((it as any).name)
          : panelName(id as any);
      out.push({ id: id as SP_COIN_DISPLAY, name });
      continue;
    }

    // tolerate legacy mirror, if it appears
    if ('displayTypeId' in it) {
      const id = mapLegacyPanelId(Number((it as any).displayTypeId));
      if (!Number.isFinite(id)) continue;
      const name =
        typeof (it as any).displayTypeName === 'string' &&
        String((it as any).displayTypeName).trim().length
          ? String((it as any).displayTypeName)
          : panelName(id as any);
      out.push({ id: id as SP_COIN_DISPLAY, name });
      continue;
    }
  }

  return out;
}

export function loadLocalExchangeContext(): ExchangeContext | null {
  try {
    const serializedContext = localStorage.getItem(EXCHANGE_CONTEXT_TREE_DISPLAY_MAP);

    if (!serializedContext) {
      debugLog.warn(
        `\u26A0\uFE0F NO LOADED EXCHANGE CONTEXT FOUND FOR KEY\n${EXCHANGE_CONTEXT_TREE_DISPLAY_MAP}`,
      );
      return null;
    }

    debugLog.log(
      '\ud83d\udd13 LOADED EXCHANGE CONTEXT FROM LOCALSTORAGE(serialized)\n:',
      serializedContext,
    );

    let parsed: any;
    try {
      parsed = deserializeWithBigInt(serializedContext);
    } catch (parseError) {
      debugLog.error(
        `\u274C Failed to deserializeWithBigInt: ${
          parseError instanceof Error ? parseError.message : String(parseError)
        }`,
      );
      return null;
    }

    debugLog.log(
      '\u2705 PARSED LOADED EXCHANGE CONTEXT FROM LOCALSTORAGE(parsed)\n:',
      parsed,
    );

    try {
      const prettyPrinted = JSON.stringify(
        parsed,
        (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
        2,
      );
      debugLog.log(
        '\u2705 (PRETTY PRINT) LOADED EXCHANGE CONTEXT FROM LOCALSTORAGE(parsed)\n:',
        prettyPrinted,
      );
    } catch (stringifyError) {
      debugLog.warn(
        '\u26A0\uFE0F Failed to pretty-print parsed ExchangeContext:',
        stringifyError,
      );
    }

    // --------- Clean up settings and normalize overlays / stacks ----------
    const settings: any = parsed?.settings ?? {};

    // Remove deprecated/legacy keys if they still exist
    if ('mainPanelNode' in settings) delete settings.mainPanelNode;
    if ('branchStack' in settings) delete settings.branchStack;
    if ('branchDisplayStack' in settings) delete settings.branchDisplayStack;

    // Coerce tree & strip non-persisted/invalid entries
    const rawTree: any[] = Array.isArray(settings.spCoinPanelTree)
      ? settings.spCoinPanelTree
      : [];

    const flatTree: Array<{ panel: SP_COIN_DISPLAY; visible: boolean; name?: string }> =
      rawTree
        .filter((n) => n && typeof n.panel === 'number')
        .map((n) => ({
          panel: mapLegacyPanelId(n.panel as SP_COIN_DISPLAY) as SP_COIN_DISPLAY,
          visible: !!n.visible,
          name: typeof n.name === 'string' ? n.name : undefined,
        }))
        .filter(
          (n) =>
            SP_COIN_DISPLAY[n.panel] !== LEGACY_BUY_LIST_NAME &&
            n.panel !== SP_COIN_DISPLAY.TOKEN_CONTRACT_PANEL &&
            n.panel !== SP_COIN_DISPLAY.UNDEFINED,
        );

    // Normalize radio overlays
    normalizeOverlayVisibility(flatTree);

    // Normalize displayStack to nodes (do NOT derive here; Provider/persist handles seeding)
    settings.displayStack = normalizeDisplayStackNodes(settings.displayStack);

    // Reassign cleaned settings, optionally bump schema
    settings.spCoinPanelTree = flatTree;
    settings.spCoinPanelSchemaVersion = Math.max(
      3,
      Number(settings.spCoinPanelSchemaVersion ?? 0),
    );

    parsed.settings = settings;
    // ----------------------------------------------------------------------

    const chainId = parsed.network?.chainId ?? CHAIN_ID.ETHEREUM;
    return sanitizeExchangeContext(parsed, chainId);
  } catch (error) {
    debugLog.error(
      `\u26D4\uFE0F Failed to load exchangeContext: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return null;
  }
}
