// File: lib/context/ScrollSelectPanels/structure/types/panelBag.ts

import { Address } from 'viem';
import { SP_COIN_DISPLAY } from '@/lib/structure';

// ---- Panel-specific bags ----
export type TokenSelectBag = {
  type:
    | SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL
    | SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL;
  /** Opposite side’s committed address */
  peerAddress?: string | Address;
};

export type RecipientSelectBag = {
  type: SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL;
  defaultRecipient?: string;
};

export type AgentSelectBag = {
  type: SP_COIN_DISPLAY.AGENT_SELECT_PANEL;
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
    | SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG_PANEL
    | SP_COIN_DISPLAY.UNDEFINED;
};

// ---- Master discriminated union ----
export type SharedPanelBag =
  | TokenSelectBag
  | RecipientSelectBag
  | AgentSelectBag
  | ErrorMessageBag
  | SimplePanelBag;

// ---- Type guard helpers ----
export const isTokenSelectBag = (b?: SharedPanelBag): b is TokenSelectBag =>
  !!b &&
  (b.type === SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL ||
    b.type === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL);
