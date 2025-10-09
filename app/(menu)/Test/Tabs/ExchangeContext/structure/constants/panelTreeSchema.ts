// File: app/(menu)/Test/Tabs/ExchangeContext/structure/constants/panelTreeSchema.ts
import { SP_COIN_DISPLAY as SPCD } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';

export type PanelKind = 'panel' | 'button' | 'list' | 'control';
export const schemaVersion = 'v1';

// ✅ Single root: MAIN_TRADING_PANEL
export const ROOTS: SPCD[] = [
  SPCD.MAIN_TRADING_PANEL,
];

// Show Trading’s inline panels + controls
export const CHILDREN: Partial<Record<SPCD, SPCD[]>> = {
  // MAIN_TRADING_PANEL contains the radio overlays
  [SPCD.MAIN_TRADING_PANEL]: [
    SPCD.TRADING_STATION_PANEL,
    SPCD.BUY_LIST_SELECT_PANEL,
    SPCD.SELL_LIST_SELECT_PANEL,
    SPCD.RECIPIENT_LIST_SELECT_PANEL,
    SPCD.AGENT_LIST_SELECT_PANEL,
    SPCD.ERROR_MESSAGE_PANEL,
    SPCD.MANAGE_SPONSORSHIPS_PANEL,
    // (Optional legacy) SPCD.SPONSOR_LIST_SELECT_PANEL,
  ],

  [SPCD.TRADING_STATION_PANEL]: [
    SPCD.SELL_SELECT_PANEL,
    SPCD.BUY_SELECT_PANEL,
    SPCD.ADD_SPONSORSHIP_PANEL,

    // controls
    SPCD.SWAP_ARROW_BUTTON,
    SPCD.PRICE_BUTTON,
    SPCD.FEE_DISCLOSURE,
    SPCD.AFFILIATE_FEE,
  ],
  [SPCD.SELL_SELECT_PANEL]: [SPCD.MANAGE_SPONSORSHIPS_BUTTON],
  [SPCD.BUY_SELECT_PANEL]: [SPCD.ADD_SPONSORSHIP_BUTTON],
  [SPCD.ADD_SPONSORSHIP_PANEL]: [SPCD.CONFIG_SPONSORSHIP_PANEL],
};

export const KINDS: Partial<Record<SPCD, PanelKind>> = {
  [SPCD.MAIN_TRADING_PANEL]: 'panel',

  [SPCD.TRADING_STATION_PANEL]: 'panel',

  [SPCD.SELL_SELECT_PANEL]: 'panel',
  [SPCD.BUY_SELECT_PANEL]: 'panel',
  [SPCD.ADD_SPONSORSHIP_PANEL]: 'panel',
  [SPCD.CONFIG_SPONSORSHIP_PANEL]: 'panel',

  [SPCD.BUY_LIST_SELECT_PANEL]: 'list',
  [SPCD.SELL_LIST_SELECT_PANEL]: 'list',
  [SPCD.RECIPIENT_LIST_SELECT_PANEL]: 'list',
  [SPCD.AGENT_LIST_SELECT_PANEL]: 'list',

  [SPCD.MANAGE_SPONSORSHIPS_PANEL]: 'panel',

  [SPCD.ADD_SPONSORSHIP_BUTTON]: 'button',
  [SPCD.MANAGE_SPONSORSHIPS_BUTTON]: 'button',

  // controls
  [SPCD.SWAP_ARROW_BUTTON]: 'control',
  [SPCD.PRICE_BUTTON]: 'control',
  [SPCD.FEE_DISCLOSURE]: 'control',
  [SPCD.AFFILIATE_FEE]: 'control',

  [SPCD.ERROR_MESSAGE_PANEL]: 'panel',
  // [SPCD.SPONSOR_LIST_SELECT_PANEL]: 'panel', // legacy if you still want to show it
};

// Optional grouping
export const GROUPS = {
  TOKEN_SELECT_LISTS: [SPCD.BUY_LIST_SELECT_PANEL, SPCD.SELL_LIST_SELECT_PANEL] as SPCD[],
  MODALS_AND_LISTS: [
    SPCD.BUY_LIST_SELECT_PANEL,
    SPCD.SELL_LIST_SELECT_PANEL,
    SPCD.RECIPIENT_LIST_SELECT_PANEL,
    SPCD.AGENT_LIST_SELECT_PANEL,
    SPCD.MANAGE_SPONSORSHIPS_PANEL,
    SPCD.ERROR_MESSAGE_PANEL,
  ] as SPCD[],
};
