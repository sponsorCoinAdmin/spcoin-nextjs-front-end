// File: app/(menu)/Test/Tabs/ExchangeContext/structure/constants/panelTreeSchema.ts
import { SP_COIN_DISPLAY as SP } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';

export type PanelKind = 'root' | 'panel' | 'button' | 'list' | 'control';
export const schemaVersion = 'v1';

// Roots (top-level siblings in the virtual tree)
export const ROOTS: SP[] = [
  SP.TRADING_STATION_PANEL,
  SP.BUY_SELECT_PANEL_LIST,
  SP.SELL_SELECT_PANEL_LIST,
  SP.RECIPIENT_SELECT_PANEL_LIST,
  SP.AGENT_SELECT_PANEL_LIST,
  SP.ERROR_MESSAGE_PANEL,
  SP.SPONSOR_SELECT_PANEL_LIST,
];

// Only show BUY/SELL/RECIPIENT inline under Trading (no controls here)
export const CHILDREN: Partial<Record<SP, SP[]>> = {
  [SP.TRADING_STATION_PANEL]: [
    SP.SELL_SELECT_PANEL,
    SP.BUY_SELECT_PANEL,
    SP.ADD_SPONSORSHIP_PANEL,
  ],
  [SP.SELL_SELECT_PANEL]: [SP.MANAGE_SPONSORSHIPS_BUTTON],
  [SP.BUY_SELECT_PANEL]: [SP.ADD_SPONSORSHIP_BUTTON],
  [SP.ADD_SPONSORSHIP_PANEL]: [SP.CONFIG_SPONSORSHIP_PANEL],
};

export const KINDS: Partial<Record<SP, PanelKind>> = {
  [SP.TRADING_STATION_PANEL]: 'root',

  [SP.SELL_SELECT_PANEL]: 'panel',
  [SP.BUY_SELECT_PANEL]: 'panel',
  [SP.ADD_SPONSORSHIP_PANEL]: 'panel',
  [SP.CONFIG_SPONSORSHIP_PANEL]: 'panel',

  [SP.BUY_SELECT_PANEL_LIST]: 'list',
  [SP.SELL_SELECT_PANEL_LIST]: 'list',
  [SP.RECIPIENT_SELECT_PANEL_LIST]: 'list',
  [SP.AGENT_SELECT_PANEL_LIST]: 'list',

  [SP.ADD_SPONSORSHIP_BUTTON]: 'button',
  [SP.MANAGE_SPONSORSHIPS_BUTTON]: 'button',

  [SP.ERROR_MESSAGE_PANEL]: 'panel',
  [SP.SPONSOR_SELECT_PANEL_LIST]: 'panel',
};

// Optional grouping tags if you ever want to use them
export const GROUPS = {
  TOKEN_SELECT_LISTS: [SP.BUY_SELECT_PANEL_LIST, SP.SELL_SELECT_PANEL_LIST] as SP[],
  MODALS_AND_LISTS: [
    SP.BUY_SELECT_PANEL_LIST,
    SP.SELL_SELECT_PANEL_LIST,
    SP.RECIPIENT_SELECT_PANEL_LIST,
    SP.AGENT_SELECT_PANEL_LIST,
    SP.ERROR_MESSAGE_PANEL,
  ] as SP[],
};
