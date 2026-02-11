// File: @/app/(menu)/Test/Tabs/ExchangeContext/structure/constants/panelTreeSchema.ts
import { SP_COIN_DISPLAY as SPCD } from '@/lib/structure';

export type PanelKind = 'panel' | 'button' | 'list' | 'control';

// ✅ bump so the virtual tree rebuilds (structure changes)
export const schemaVersion = 'v17';

// ✅ Single root: MAIN_TRADING_PANEL
export const ROOTS: SPCD[] = [SPCD.MAIN_TRADING_PANEL];

// Show Trading’s inline panels + controls
export const CHILDREN: Partial<Record<SPCD, SPCD[]>> = {
  // MAIN_TRADING_PANEL contains the radio overlays, manage hub, lists AND detail panels
  [SPCD.MAIN_TRADING_PANEL]: [
    // Core trading panel
    SPCD.TRADING_STATION_PANEL,

    // Token selectors
    SPCD.TOKEN_LIST_SELECT_PANEL,

    // ✅ Staking overlay (with its own children)
    SPCD.STAKING_SPCOINS_PANEL,

    // ✅ Account list selector overlay (new)
    SPCD.ACCOUNT_LIST_SELECT_PANEL,

    // ✅ Rewards list overlay root
    SPCD.ACCOUNT_LIST_REWARDS_PANEL,

    // Errors / hub
    SPCD.ERROR_MESSAGE_PANEL,
    SPCD.MANAGE_SPONSORSHIPS_PANEL,

    // ✅ Shared + Manage DETAIL views
    SPCD.ACCOUNT_PANEL,

    // ✅ Token contract overlay (show in tree)
    SPCD.TOKEN_PANEL,
  ],

  // ✅ Desired output: CONFIG_SLIPPAGE_PANEL is nested under TRADING_STATION_PANEL
  [SPCD.TRADING_STATION_PANEL]: [
    SPCD.CONFIG_SLIPPAGE_PANEL,

    // trading pair container
    SPCD.EXCHANGE_TRADING_PAIR,

    // controls
    SPCD.FEE_DISCLOSURE,
    SPCD.AFFILIATE_FEE,
  ],

  // ✅ Desired order inside EXCHANGE_TRADING_PAIR:
  // SELL_SELECT_PANEL (with MANAGE_SPONSORSHIPS_BUTTON nested under it),
  // SWAP_ARROW_BUTTON,
  // BUY_SELECT_PANEL
  [SPCD.EXCHANGE_TRADING_PAIR]: [
    SPCD.SELL_SELECT_PANEL,
    SPCD.SWAP_ARROW_BUTTON,
    SPCD.BUY_SELECT_PANEL,
  ],

  [SPCD.SELL_SELECT_PANEL]: [SPCD.MANAGE_SPONSORSHIPS_BUTTON],
  [SPCD.BUY_SELECT_PANEL]: [SPCD.ADD_SPONSORSHIP_BUTTON],
  [SPCD.ADD_SPONSORSHIP_PANEL]: [SPCD.CONFIG_SPONSORSHIP_PANEL],

  // ✅ STAKING_SPCOINS_PANEL desired subtree:
  [SPCD.STAKING_SPCOINS_PANEL]: [
    SPCD.STAKE_TRADING_SPCOINS_PANEL,
    SPCD.ADD_SPONSORSHIP_PANEL,
    SPCD.CONNECT_TRADE_BUTTON,
  ],

  // ✅ ACCOUNT_LIST_REWARDS_PANEL desired subtree:
  [SPCD.ACCOUNT_LIST_REWARDS_PANEL]: [
    SPCD.PENDING_SPONSOR_REWARDS,
    SPCD.PENDING_RECIPIENT_REWARDS,
    SPCD.PENDING_AGENT_REWARDS,
    SPCD.ACTIVE_SPONSORSHIPS,
  ],

  // ✅ FIX: ACCOUNT_PANEL desired subtree:
  [SPCD.ACCOUNT_PANEL]: [
    SPCD.SPONSOR_ACCOUNT,
    SPCD.RECIPIENT_ACCOUNT,
    SPCD.AGENT_ACCOUNT,
  ],

  // ✅ ACCOUNT_LIST_SELECT_PANEL desired subtree:
  [SPCD.ACCOUNT_LIST_SELECT_PANEL]: [SPCD.SPONSOR_LIST, SPCD.RECIPIENT_LIST, SPCD.AGENT_LIST],

  // ✅ NEW: TOKEN_PANEL desired subtree:
  // Matches ACCOUNT_PANEL behavior (children visible as modes)
  [SPCD.TOKEN_PANEL]: [SPCD.BUY_CONTRACT, SPCD.SELL_CONTRACT, SPCD.PREVIEW_CONTRACT],

  // ✅ Leaf nodes
  [SPCD.PENDING_SPONSOR_REWARDS]: [],
  [SPCD.PENDING_RECIPIENT_REWARDS]: [],
  [SPCD.PENDING_AGENT_REWARDS]: [],
  [SPCD.ACTIVE_SPONSORSHIPS]: [],

  // ✅ ACCOUNT_PANEL leaf nodes
  [SPCD.SPONSOR_ACCOUNT]: [],
  [SPCD.RECIPIENT_ACCOUNT]: [],
  [SPCD.AGENT_ACCOUNT]: [],

  // ✅ TOKEN_PANEL leaf nodes
  [SPCD.BUY_CONTRACT]: [],
  [SPCD.SELL_CONTRACT]: [],
  [SPCD.PREVIEW_CONTRACT]: [],

  // ✅ ACCOUNT_LIST_SELECT_PANEL leaf nodes
  [SPCD.SPONSOR_LIST]: [],
  [SPCD.RECIPIENT_LIST]: [],
  [SPCD.AGENT_LIST]: [],

  // ✅ STAKE_TRADING_SPCOINS_PANEL leaf node
  [SPCD.STAKE_TRADING_SPCOINS_PANEL]: [],
};

export const KINDS: Partial<Record<SPCD, PanelKind>> = {
  [SPCD.MAIN_TRADING_PANEL]: 'panel',
  [SPCD.TRADING_STATION_PANEL]: 'panel',
  [SPCD.STAKING_SPCOINS_PANEL]: 'panel',
  [SPCD.STAKE_TRADING_SPCOINS_PANEL]: 'panel',

  [SPCD.CONFIG_SLIPPAGE_PANEL]: 'panel',
  [SPCD.EXCHANGE_TRADING_PAIR]: 'panel',

  [SPCD.SELL_SELECT_PANEL]: 'panel',
  [SPCD.BUY_SELECT_PANEL]: 'panel',
  [SPCD.ADD_SPONSORSHIP_PANEL]: 'panel',
  [SPCD.CONFIG_SPONSORSHIP_PANEL]: 'panel',

  // Token selector overlays
  [SPCD.TOKEN_LIST_SELECT_PANEL]: 'list',

  // ✅ Rewards list overlay root
  [SPCD.ACCOUNT_LIST_REWARDS_PANEL]: 'panel',

  // ✅ NEW chevron pending flags (persisted UI state; not a visual panel)
  [SPCD.CHEVRON_DOWN_OPEN_PENDING]: 'control',

  // ✅ Account list selector overlay
  [SPCD.ACCOUNT_LIST_SELECT_PANEL]: 'list',

  [SPCD.MANAGE_SPONSORSHIPS_PANEL]: 'panel',

  // ✅ Sub-panels under ACCOUNT_LIST_REWARDS_PANEL
  [SPCD.PENDING_SPONSOR_REWARDS]: 'panel',
  [SPCD.PENDING_RECIPIENT_REWARDS]: 'panel',
  [SPCD.PENDING_AGENT_REWARDS]: 'panel',
  [SPCD.ACTIVE_SPONSORSHIPS]: 'panel',

  // ✅ ACCOUNT_PANEL children kinds
  [SPCD.SPONSOR_ACCOUNT]: 'panel',
  [SPCD.RECIPIENT_ACCOUNT]: 'panel',
  [SPCD.AGENT_ACCOUNT]: 'panel',

  // ✅ Shared + Manage DETAIL views
  [SPCD.ACCOUNT_PANEL]: 'panel',

  [SPCD.ADD_SPONSORSHIP_BUTTON]: 'button',
  [SPCD.MANAGE_SPONSORSHIPS_BUTTON]: 'button',

  // controls
  [SPCD.SWAP_ARROW_BUTTON]: 'control',
  [SPCD.CONNECT_TRADE_BUTTON]: 'control',
  [SPCD.FEE_DISCLOSURE]: 'control',
  [SPCD.AFFILIATE_FEE]: 'control',

  [SPCD.ERROR_MESSAGE_PANEL]: 'panel',

  // ✅ show token contract node in this UI
  [SPCD.TOKEN_PANEL]: 'panel',

  // ✅ ACCOUNT_LIST_SELECT_PANEL children kinds
  [SPCD.SPONSOR_LIST]: 'list',
  [SPCD.RECIPIENT_LIST]: 'list',
  [SPCD.AGENT_LIST]: 'list',

  // ✅ NEW: TOKEN_PANEL children kinds
  [SPCD.BUY_CONTRACT]: 'panel',
  [SPCD.SELL_CONTRACT]: 'panel',
  [SPCD.PREVIEW_CONTRACT]: 'panel',
};

// Optional grouping (updated to include manage panels)
export const GROUPS = {
  TOKEN_SELECT_LISTS: [
    SPCD.TOKEN_LIST_SELECT_PANEL,
  ] as SPCD[],

  MODALS_AND_LISTS: [
    SPCD.TOKEN_LIST_SELECT_PANEL,

    SPCD.MANAGE_SPONSORSHIPS_PANEL,

    // ✅ Rewards list overlay root
    SPCD.ACCOUNT_LIST_REWARDS_PANEL,

    // ✅ NEW chevron pending flags (persisted UI state)
    SPCD.CHEVRON_DOWN_OPEN_PENDING,

    // ✅ Account list selector overlay + children
    SPCD.ACCOUNT_LIST_SELECT_PANEL,
    SPCD.SPONSOR_LIST,
    SPCD.RECIPIENT_LIST,
    SPCD.AGENT_LIST,

    // ✅ Rewards sub-panels
    SPCD.PENDING_SPONSOR_REWARDS,
    SPCD.PENDING_RECIPIENT_REWARDS,
    SPCD.PENDING_AGENT_REWARDS,
    SPCD.ACTIVE_SPONSORSHIPS,

    // ✅ Account panel state children
    SPCD.SPONSOR_ACCOUNT,
    SPCD.RECIPIENT_ACCOUNT,
    SPCD.AGENT_ACCOUNT,

    // ✅ Account panel node
    SPCD.ACCOUNT_PANEL,

    // ✅ Token contract overlay + children
    SPCD.TOKEN_PANEL,
    SPCD.BUY_CONTRACT,
    SPCD.SELL_CONTRACT,
    SPCD.PREVIEW_CONTRACT,

    SPCD.ERROR_MESSAGE_PANEL,
  ] as SPCD[],
};
