// lib/context/exchangeContext/helpers/panelReconcile.ts
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { MAIN_RADIO_OVERLAY_PANELS } from '@/lib/structure/exchangeContext/registry/panelRegistry';

type FlatEntry = { panel: SP_COIN_DISPLAY; visible: boolean };
type RadioNode = { panel: SP_COIN_DISPLAY; visible: boolean; children?: RadioNode[] };

// Map flat overlay IDs to radio top-level IDs (if the enums differ)
const RADIO_ALIAS: Partial<Record<SP_COIN_DISPLAY, SP_COIN_DISPLAY>> = {
  [SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL]: SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL,
  [SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL]: SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL,
  [SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL]: SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL,
  [SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL]: SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL,
};

/**
 * Policy:
 * - Normalize MAIN_RADIO_OVERLAY_PANELS to 0 or 1 visible.
 * - NEVER force-open TRADING_STATION_PANEL (or any overlay) implicitly.
 * - If there is no visible overlay, keep overlay group empty.
 * - Caller may optionally provide a fallback overlay when none is visible.
 */
export function reconcilePanelState(
  flat: FlatEntry[],
  radio: RadioNode[],
  fallback?: SP_COIN_DISPLAY | null,
) {
  // 1) Find selected overlay from current flat state
  const selectedFromFlat = flat.find(
    (e) => MAIN_RADIO_OVERLAY_PANELS.includes(e.panel) && e.visible,
  )?.panel;

  // 2) Use fallback ONLY if explicitly provided by the caller
  const selectedFlat = selectedFromFlat ?? (fallback ?? null);

  // 3) Nothing selected => leave overlay group EMPTY (0 visible)
  if (selectedFlat == null) {
    for (const e of flat) {
      if (MAIN_RADIO_OVERLAY_PANELS.includes(e.panel)) e.visible = false;
    }
    for (const n of radio) {
      if (MAIN_RADIO_OVERLAY_PANELS.includes(n.panel)) n.visible = false;
    }
    return;
  }

  // 4) Map to radio top-level ID
  const selectedRadio = RADIO_ALIAS[selectedFlat] ?? selectedFlat;

  // 5) Normalize flat overlays: exactly one visible
  for (const e of flat) {
    if (MAIN_RADIO_OVERLAY_PANELS.includes(e.panel)) e.visible = e.panel === selectedFlat;
  }

  // 6) Normalize radio overlays: exactly one visible
  for (const n of radio) {
    if (MAIN_RADIO_OVERLAY_PANELS.includes(n.panel)) n.visible = n.panel === selectedRadio;
  }
}
