// File: app/(menu)/Test/Tabs/ExchangeContext/structure/constants/panelTreeSchema.ts
import { SP_COIN_DISPLAY as SPCD } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';

export type PanelKind = 'panel' | 'button' | 'list' | 'control';
export const schemaVersion = 'v1';

// Roots (top-level siblings in the virtual tree)
export const ROOTS: SPCD[] = [
  SPCD.TRADING_STATION_PANEL,
  SPCD.BUY_SELECT_PANEL_LIST,
  SPCD.SELL_SELECT_PANEL_LIST,
  SPCD.RECIPIENT_SELECT_PANEL_LIST,
  SPCD.AGENT_SELECT_PANEL_LIST,
  SPCD.ERROR_MESSAGE_PANEL,
  SPCD.SPONSOR_SELECT_PANEL_LIST,
];

// Show Trading’s inline panels + controls
export const CHILDREN: Partial<Record<SPCD, SPCD[]>> = {
  [SPCD.TRADING_STATION_PANEL]: [
    SPCD.SELL_SELECT_PANEL,
    SPCD.BUY_SELECT_PANEL,
    SPCD.ADD_SPONSORSHIP_PANEL,

    // ✅ add controls so they appear in the Test tree
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
  [SPCD.TRADING_STATION_PANEL]: 'panel',

  [SPCD.SELL_SELECT_PANEL]: 'panel',
  [SPCD.BUY_SELECT_PANEL]: 'panel',
  [SPCD.ADD_SPONSORSHIP_PANEL]: 'panel',
  [SPCD.CONFIG_SPONSORSHIP_PANEL]: 'panel',

  [SPCD.BUY_SELECT_PANEL_LIST]: 'list',
  [SPCD.SELL_SELECT_PANEL_LIST]: 'list',
  [SPCD.RECIPIENT_SELECT_PANEL_LIST]: 'list',
  [SPCD.AGENT_SELECT_PANEL_LIST]: 'list',

  [SPCD.ADD_SPONSORSHIP_BUTTON]: 'button',
  [SPCD.MANAGE_SPONSORSHIPS_BUTTON]: 'button',

  // ✅ mark controls so the Test UI can style/treat them distinctly if desired
  [SPCD.SWAP_ARROW_BUTTON]: 'control',
  [SPCD.PRICE_BUTTON]: 'control',
  [SPCD.FEE_DISCLOSURE]: 'control',
  [SPCD.AFFILIATE_FEE]: 'control',

  [SPCD.ERROR_MESSAGE_PANEL]: 'panel',
  [SPCD.SPONSOR_SELECT_PANEL_LIST]: 'panel',
};

// Optional grouping unchanged…
export const GROUPS = {
  TOKEN_SELECT_LISTS: [SPCD.BUY_SELECT_PANEL_LIST, SPCD.SELL_SELECT_PANEL_LIST] as SPCD[],
  MODALS_AND_LISTS: [
    SPCD.BUY_SELECT_PANEL_LIST,
    SPCD.SELL_SELECT_PANEL_LIST,
    SPCD.RECIPIENT_SELECT_PANEL_LIST,
    SPCD.AGENT_SELECT_PANEL_LIST,
    SPCD.ERROR_MESSAGE_PANEL,
  ] as SPCD[],
};
