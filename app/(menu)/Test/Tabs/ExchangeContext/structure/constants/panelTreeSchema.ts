// File: @/app/(menu)/Test/Tabs/ExchangeContext/structure/constants/panelTreeSchema.ts
import { SP_COIN_DISPLAY as SPCD } from '@/lib/structure';

export type PanelKind = 'panel' | 'button' | 'list' | 'control';
export const schemaVersion = 'v2'; // ⬅️ bump so the virtual tree rebuilds

// ✅ Single root: MAIN_TRADING_PANEL
export const ROOTS: SPCD[] = [SPCD.MAIN_TRADING_PANEL];

// Show Trading’s inline panels + controls
export const CHILDREN: Partial<Record<SPCD, SPCD[]>> = {
  // MAIN_TRADING_PANEL contains the radio overlays, manage hub, lists AND detail panels
  [SPCD.MAIN_TRADING_PANEL]: [
    // Core trading panel
    SPCD.TRADING_STATION_PANEL,

    // Token selectors
    SPCD.BUY_LIST_SELECT_PANEL,
    SPCD.SELL_LIST_SELECT_PANEL,

    // Address selectors
    SPCD.RECIPIENT_LIST_SELECT_PANEL,
    SPCD.AGENT_LIST_SELECT_PANEL,

    // Errors / hub
    SPCD.ERROR_MESSAGE_PANEL,
    SPCD.MANAGE_SPONSORSHIPS_PANEL,

    // ✅ Manage LIST views
    SPCD.MANAGE_RECIPIENTS_PANEL,
    SPCD.MANAGE_AGENTS_PANEL,
    SPCD.CLAIM_SPONSOR_REWARDS_LIST_PANEL,

    // ✅ Manage DETAIL views (these were missing from the schema)
    SPCD.MANAGE_AGENT_PANEL,
    SPCD.MANAGE_RECIPIENT_PANEL,
    SPCD.MANAGE_SPONSOR_PANEL,

    // (Optional legacy) SPCD.SPONSOR_LIST_SELECT_PANEL,
  ],

  [SPCD.TRADING_STATION_PANEL]: [
    SPCD.SELL_SELECT_PANEL,
    SPCD.BUY_SELECT_PANEL,
    SPCD.ADD_SPONSORSHIP_PANEL,

    // controls
    SPCD.SWAP_ARROW_BUTTON,
    SPCD.CONNECT_PRICE_BUTTON,
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

  // ✅ Manage LIST views
  [SPCD.MANAGE_RECIPIENTS_PANEL]: 'panel',
  [SPCD.MANAGE_AGENTS_PANEL]: 'panel',
  [SPCD.CLAIM_SPONSOR_REWARDS_LIST_PANEL]: 'panel',

  // ✅ Manage DETAIL views
  [SPCD.MANAGE_AGENT_PANEL]: 'panel',
  [SPCD.MANAGE_RECIPIENT_PANEL]: 'panel',
  [SPCD.MANAGE_SPONSOR_PANEL]: 'panel',

  [SPCD.ADD_SPONSORSHIP_BUTTON]: 'button',
  [SPCD.MANAGE_SPONSORSHIPS_BUTTON]: 'button',

  // controls
  [SPCD.SWAP_ARROW_BUTTON]: 'control',
  [SPCD.CONNECT_PRICE_BUTTON]: 'control',
  [SPCD.FEE_DISCLOSURE]: 'control',
  [SPCD.AFFILIATE_FEE]: 'control',

  [SPCD.ERROR_MESSAGE_PANEL]: 'panel',
  // [SPCD.SPONSOR_LIST_SELECT_PANEL]: 'panel', // legacy if you still want to show it
};

// Optional grouping (updated to include manage panels)
export const GROUPS = {
  TOKEN_SELECT_LISTS: [SPCD.BUY_LIST_SELECT_PANEL, SPCD.SELL_LIST_SELECT_PANEL] as SPCD[],
  MODALS_AND_LISTS: [
    SPCD.BUY_LIST_SELECT_PANEL,
    SPCD.SELL_LIST_SELECT_PANEL,
    SPCD.RECIPIENT_LIST_SELECT_PANEL,
    SPCD.AGENT_LIST_SELECT_PANEL,
    SPCD.MANAGE_SPONSORSHIPS_PANEL,

    // ✅ include manage list & detail panels so they’re easy to toggle/view in the test UI
    SPCD.MANAGE_RECIPIENTS_PANEL,
    SPCD.MANAGE_AGENTS_PANEL,
    SPCD.CLAIM_SPONSOR_REWARDS_LIST_PANEL,
    SPCD.MANAGE_RECIPIENT_PANEL,
    SPCD.MANAGE_AGENT_PANEL,
    SPCD.MANAGE_SPONSOR_PANEL,

    SPCD.ERROR_MESSAGE_PANEL,
  ] as SPCD[],
};
