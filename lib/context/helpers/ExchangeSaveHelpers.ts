// File: lib/context/exchangeContext/helpers/ExchangeSaveHelpers.ts
import { ExchangeContext } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/registry/panelRegistry';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

const STORAGE_KEY = 'exchangeContext';
const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_HELPER === 'true';
const debugLog = createDebugLogger('ExchangeSaveHelpers', DEBUG_ENABLED, LOG_TIME);

type FlatPanel = { panel: SP_COIN_DISPLAY; visible: boolean; name?: string };

/* ───────────────────────────── helpers ───────────────────────────── */

const nameOf = (id: number) => (SP_COIN_DISPLAY as any)[id] ?? String(id);

function toFlat(list: any[] | undefined): FlatPanel[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((n) => n && typeof n.panel === 'number')
    .map((n) => ({
      panel: n.panel as SP_COIN_DISPLAY,
      visible: !!n.visible,
      name: typeof n.name === 'string' ? n.name : undefined,
    }));
}

function visibleList(flat: FlatPanel[]): string {
  const names = flat.filter((p) => p.visible).map((p) => p.name ?? nameOf(p.panel));
  return names.length ? names.join('.') + '.' : '(none)';
}

/** Compare visibility vs. previous storage for a concise diff. */
function diffVisibility(prev: FlatPanel[], next: FlatPanel[]): string {
  const prevMap = new Map<number, boolean>(prev.map((p) => [p.panel, !!p.visible]));
  const nextMap = new Map<number, boolean>(next.map((p) => [p.panel, !!p.visible]));
  const ids = new Set<number>([...prevMap.keys(), ...nextMap.keys()]);
  const changes: string[] = [];
  ids.forEach((id) => {
    const a = prevMap.get(id);
    const b = nextMap.get(id);
    if (a !== b) changes.push(`${nameOf(id)} ${String(a)} → ${String(b)}`);
  });
  return changes.length ? changes.join(', ') : '(no visibility changes)';
}

/** Ensure exactly one MAIN_OVERLAY_GROUP panel is visible; if none, pick TRADING_STATION_PANEL. */
function normalizeOverlayVisibility(flat: FlatPanel[], fallback: SP_COIN_DISPLAY) {
  const current = flat.find((p) => MAIN_OVERLAY_GROUP.includes(p.panel) && p.visible)?.panel;
  const chosen = current ?? fallback;
  for (const p of flat) {
    if (MAIN_OVERLAY_GROUP.includes(p.panel)) p.visible = p.panel === chosen;
  }
  return chosen;
}

/* ───────────────────────────── main API ───────────────────────────── */

export function saveLocalExchangeContext(ctx: ExchangeContext) {
  try {
    // Snapshot previous saved panels (for diff)
    let prevSavedPanels: FlatPanel[] = [];
    try {
      const prevRaw = localStorage.getItem(STORAGE_KEY);
      if (prevRaw) {
        const prevParsed = JSON.parse(prevRaw);
        prevSavedPanels = toFlat(prevParsed?.settings?.spCoinPanelTree);
      }
    } catch {
      // ignore read/parse errors
    }

    // Clone to avoid mutating live state
    // Use structuredClone when available; otherwise clone via BigInt-safe stringify
    const out: any =
      typeof structuredClone === 'function'
        ? structuredClone(ctx)
        : JSON.parse(stringifyBigInt(ctx));

    // Settings container
    out.settings = { ...(out.settings ?? {}) };

    // 1) Never persist legacy/derived fields
    if ('mainPanelNode' in out.settings) {
      delete out.settings.mainPanelNode;
      debugLog.log('🧹 Removed settings.mainPanelNode before save');
    }

    // 2) Coerce and sanitize spCoinPanelTree
    const rawTree: any[] = Array.isArray(out.settings.spCoinPanelTree)
      ? out.settings.spCoinPanelTree
      : [];

    let flatTree: FlatPanel[] = toFlat(rawTree)
      // Never persist these
      .filter(
        (n) =>
          n.panel !== SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL &&
          n.panel !== SP_COIN_DISPLAY.UNDEFINED
      );

    // Pre-normalize visibility picture (for logging)
    const preNormalizeVisible = visibleList(flatTree);

    // 3) Normalize overlays to avoid multi-select bugs in storage
    const chosenOverlay = normalizeOverlayVisibility(
      flatTree,
      SP_COIN_DISPLAY.TRADING_STATION_PANEL
    );

    // 4) Write back sanitized tree and bump schema
    out.settings.spCoinPanelTree = flatTree;
    out.settings.spCoinPanelSchemaVersion = Math.max(
      3,
      Number(out.settings.spCoinPanelSchemaVersion ?? 0)
    );

    // Compose a concise, actionable debug record
    const visDiff = diffVisibility(prevSavedPanels, flatTree);
    debugLog.log(
      [
        '💾 Saving ExchangeContext → localStorage',
        `• Overlay chosen: ${nameOf(chosenOverlay)}`,
        `• Visible (pre-normalize snapshot): ${preNormalizeVisible}`,
        `• Visibility diff vs. previous save: ${visDiff}`,
      ].join('\n')
    );

    const serialized = stringifyBigInt(out);
    localStorage.setItem(STORAGE_KEY, serialized);

    // 5) Read-back verification
    try {
      const roundTrip = localStorage.getItem(STORAGE_KEY);
      const landedPanels = toFlat((roundTrip && JSON.parse(roundTrip))?.settings?.spCoinPanelTree);
      debugLog.log(
        [
          '✅ Read-back verification',
          `• Visible panels persisted: ${visibleList(landedPanels)}`,
        ].join('\n')
      );
    } catch {
      debugLog.warn('⚠️ Unable to parse read-back verification payload.');
    }
  } catch (err) {
    debugLog.error(
      `⛔ Failed to save exchangeContext: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    // Best-effort only; do not throw
  }
}
