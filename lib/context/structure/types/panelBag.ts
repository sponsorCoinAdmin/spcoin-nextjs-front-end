// File: @/lib/context/ScrollSelectPanels/structure/types/panelBag.ts

import type { Address } from 'viem';
import { SP_COIN_DISPLAY } from '@/lib/structure';

// ---- Panel-specific bags ----
export type TokenSelectBag = {
  type:
    | SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL
    | SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL;
  /** Opposite side’s committed address */
  peerAddress?: string | Address;
};

export type RecipientSelectBag = {
  type: SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL_OLD;
  defaultRecipient?: string;
};

export type AgentSelectBag = {
  type: SP_COIN_DISPLAY.AGIENT_LIST_SELECT_PANEL_OLD;
  defaultAgentId?: string;
};

export type ErrorMessageBag = {
  type: SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL;
  message: string;
  detail?: string;
};

// Panels that don’t need extra payload
export type SimplePanelBag = {
  type:
    | SP_COIN_DISPLAY.TRADING_STATION_PANEL
    | SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL
    | SP_COIN_DISPLAY.UNDEFINED;
};

// ---- Master discriminated union ----
export type AssetSelectBag =
  | TokenSelectBag
  | RecipientSelectBag
  | AgentSelectBag
  | ErrorMessageBag
  | SimplePanelBag;

// ---- Type guard helpers ----
export const isTokenSelectBag = (b?: AssetSelectBag): b is TokenSelectBag =>
  !!b &&
  (b.type === SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL ||
    b.type === SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
