// lib/context/exchangeContext/helpers/panelReconcile.ts
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/registry/panelRegistry';

type FlatEntry = { panel: SP_COIN_DISPLAY; visible: boolean };
type RadioNode = { panel: SP_COIN_DISPLAY; visible: boolean; children?: RadioNode[] };

// Map flat overlay IDs to radio top-level IDs (if the enums differ)
const RADIO_ALIAS: Partial<Record<SP_COIN_DISPLAY, SP_COIN_DISPLAY>> = {
  [SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL]: SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL,
  [SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL]: SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL,
  [SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL]: SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL,
  [SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL]: SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL,
};

export function reconcilePanelState(
  flat: FlatEntry[],
  radio: RadioNode[],
  fallback: SP_COIN_DISPLAY = SP_COIN_DISPLAY.TRADING_STATION_PANEL
) {
  // 1) Find currently selected overlay in the flat list (or fallback)
  const selectedFlat =
    flat.find((e) => MAIN_OVERLAY_GROUP.includes(e.panel) && e.visible)?.panel ?? fallback;

  // 2) Map it to radio list’s top-level ID
  const selectedRadio = RADIO_ALIAS[selectedFlat] ?? selectedFlat;

  // 3) Normalize flat: exactly one visible in MAIN_OVERLAY_GROUP
  for (const e of flat) {
    if (MAIN_OVERLAY_GROUP.includes(e.panel)) e.visible = e.panel === selectedFlat;
  }

  // 4) Normalize radio: only selectedRadio visible among top-level radio nodes
  for (const n of radio) {
    if (MAIN_OVERLAY_GROUP.includes(n.panel)) n.visible = n.panel === selectedRadio;
  }
}
