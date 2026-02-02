// File: @/app/(menu)/Test/Tabs/ExchangeContext/structure/constants/panelTreeSchema.ts
import { SP_COIN_DISPLAY as SPCD } from '@/lib/structure';

export type PanelKind = 'panel' | 'button' | 'list' | 'control';

// ✅ bump so the virtual tree rebuilds (structure changes)
export const schemaVersion = 'v8';

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

    // ✅ Rewards list overlay root
    SPCD.ACCOUNT_LIST_REWARDS_PANEL,

    // ✅ OLD list overlays (legacy behavior)
    SPCD.RECIPIENT_LIST_SELECT_PANEL,
    SPCD.AGENT_LIST_SELECT_PANEL,

    // Errors / hub
    SPCD.ERROR_MESSAGE_PANEL,
    SPCD.MANAGE_SPONSORSHIPS_PANEL,

    // ✅ Manage DETAIL views
    SPCD.AGENT_ACCOUNT_PANEL,
    SPCD.RECIPIENT_ACCOUNT_PANEL,
    SPCD.SPONSOR_ACCOUNT_PANEL,

    // (Optional legacy) SPCD.TOKEN_CONTRACT_PANEL,
  ],

  // ✅ Desired output: CONFIG_SLIPPAGE_PANEL is nested under TRADING_STATION_PANEL
  [SPCD.TRADING_STATION_PANEL]: [
    SPCD.CONFIG_SLIPPAGE_PANEL,

    // trading pair container
    SPCD.EXCHANGE_TRADING_PAIR,

    // other inline panels under trading
    SPCD.ADD_SPONSORSHIP_PANEL,

    // controls
    SPCD.CONNECT_TRADE_BUTTON,
    SPCD.FEE_DISCLOSURE,
    SPCD.AFFILIATE_FEE,
  ],

  // ✅ Desired order inside EXCHANGE_TRADING_PAIR:
  // SELL_SELECT_PANEL (with MANAGE_SPONSORSHIPS_BUTTON nested under it),
  // SWAP_ARROW_BUTTON,
  // BUY_SELECT_PANEL
  [SPCD.EXCHANGE_TRADING_PAIR]: [SPCD.SELL_SELECT_PANEL, SPCD.SWAP_ARROW_BUTTON, SPCD.BUY_SELECT_PANEL],

  [SPCD.SELL_SELECT_PANEL]: [SPCD.MANAGE_SPONSORSHIPS_BUTTON],
  [SPCD.BUY_SELECT_PANEL]: [SPCD.ADD_SPONSORSHIP_BUTTON],
  [SPCD.ADD_SPONSORSHIP_PANEL]: [SPCD.CONFIG_SPONSORSHIP_PANEL],

  // ✅ ACCOUNT_LIST_REWARDS_PANEL desired subtree:
  //
  // [-] ACCOUNT_LIST_REWARDS_PANEL
  //     [-] PENDING_SPONSOR_COINS
  //     [+] PENDING_RECIPIENT_COINS
  //     [+] PENDING_AGENT_COINS
  //     [+] UNSPONSOR_SP_COINS
  //
  [SPCD.ACCOUNT_LIST_REWARDS_PANEL]: [
    SPCD.PENDING_SPONSOR_COINS,
    SPCD.PENDING_RECIPIENT_COINS,
    SPCD.PENDING_AGENT_COINS,
    SPCD.UNSPONSOR_SP_COINS,
  ],

  // ✅ No synthetic "mode selector" children anymore
  [SPCD.PENDING_SPONSOR_COINS]: [],
  [SPCD.PENDING_RECIPIENT_COINS]: [],
  [SPCD.PENDING_AGENT_COINS]: [],
  [SPCD.UNSPONSOR_SP_COINS]: [],
};

export const KINDS: Partial<Record<SPCD, PanelKind>> = {
  [SPCD.MAIN_TRADING_PANEL]: 'panel',
  [SPCD.TRADING_STATION_PANEL]: 'panel',

  [SPCD.CONFIG_SLIPPAGE_PANEL]: 'panel',
  [SPCD.EXCHANGE_TRADING_PAIR]: 'panel',

  [SPCD.SELL_SELECT_PANEL]: 'panel',
  [SPCD.BUY_SELECT_PANEL]: 'panel',
  [SPCD.ADD_SPONSORSHIP_PANEL]: 'panel',
  [SPCD.CONFIG_SPONSORSHIP_PANEL]: 'panel',

  [SPCD.BUY_LIST_SELECT_PANEL]: 'list',
  [SPCD.SELL_LIST_SELECT_PANEL]: 'list',

  // ✅ Rewards list overlay root
  [SPCD.ACCOUNT_LIST_REWARDS_PANEL]: 'panel',

  // ✅ NEW chevron pending flags (persisted UI state; not a visual panel)
  [SPCD.CHEVRON_DOWN_OPEN_PENDING]: 'control',

  // ✅ OLD list overlays (legacy behavior)
  [SPCD.RECIPIENT_LIST_SELECT_PANEL]: 'list',
  [SPCD.AGENT_LIST_SELECT_PANEL]: 'list',

  [SPCD.MANAGE_SPONSORSHIPS_PANEL]: 'panel',

  // ✅ Sub-panels under ACCOUNT_LIST_REWARDS_PANEL
  [SPCD.PENDING_SPONSOR_COINS]: 'panel',
  [SPCD.PENDING_RECIPIENT_COINS]: 'panel',
  [SPCD.PENDING_AGENT_COINS]: 'panel',
  [SPCD.UNSPONSOR_SP_COINS]: 'panel',

  // ✅ Manage DETAIL views
  [SPCD.AGENT_ACCOUNT_PANEL]: 'panel',
  [SPCD.RECIPIENT_ACCOUNT_PANEL]: 'panel',
  [SPCD.SPONSOR_ACCOUNT_PANEL]: 'panel',

  [SPCD.ADD_SPONSORSHIP_BUTTON]: 'button',
  [SPCD.MANAGE_SPONSORSHIPS_BUTTON]: 'button',

  // controls
  [SPCD.SWAP_ARROW_BUTTON]: 'control',
  [SPCD.CONNECT_TRADE_BUTTON]: 'control',
  [SPCD.FEE_DISCLOSURE]: 'control',
  [SPCD.AFFILIATE_FEE]: 'control',

  [SPCD.ERROR_MESSAGE_PANEL]: 'panel',
  [SPCD.TOKEN_CONTRACT_PANEL]: 'panel', // legacy/test UI support
};

// Optional grouping (updated to include manage panels)
export const GROUPS = {
  TOKEN_SELECT_LISTS: [SPCD.BUY_LIST_SELECT_PANEL, SPCD.SELL_LIST_SELECT_PANEL] as SPCD[],

  MODALS_AND_LISTS: [
    SPCD.BUY_LIST_SELECT_PANEL,
    SPCD.SELL_LIST_SELECT_PANEL,

    SPCD.MANAGE_SPONSORSHIPS_PANEL,

    // ✅ Rewards list overlay root
    SPCD.ACCOUNT_LIST_REWARDS_PANEL,

    // ✅ NEW chevron pending flags (persisted UI state)
    SPCD.CHEVRON_DOWN_OPEN_PENDING,

    // ✅ OLD list overlays
    SPCD.RECIPIENT_LIST_SELECT_PANEL,
    SPCD.AGENT_LIST_SELECT_PANEL,

    // ✅ Rewards sub-panels
    SPCD.PENDING_SPONSOR_COINS,
    SPCD.PENDING_RECIPIENT_COINS,
    SPCD.PENDING_AGENT_COINS,
    SPCD.UNSPONSOR_SP_COINS,

    // Detail panels
    SPCD.RECIPIENT_ACCOUNT_PANEL,
    SPCD.AGENT_ACCOUNT_PANEL,
    SPCD.SPONSOR_ACCOUNT_PANEL,

    SPCD.ERROR_MESSAGE_PANEL,
  ] as SPCD[],
};
