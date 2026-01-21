// File: @/app/(menu)/Test/Tabs/ExchangeContext/structure/constants/panelTreeSchema.ts
import { SP_COIN_DISPLAY as SPCD } from '@/lib/structure';

export type PanelKind = 'panel' | 'button' | 'list' | 'control';

// ✅ bump so the virtual tree rebuilds (structure changes)
export const schemaVersion = 'v7';

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

    // ✅ Manage LIST views (NEW + OLD)
    SPCD.ACCOUNT_LIST_REWARDS_PANEL,

    // ✅ OLD list overlays (legacy behavior)
    SPCD.RECIPIENT_LIST_SELECT_PANEL_OLD,
    SPCD.AGENT_LIST_SELECT_PANEL_OLD,

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
  // [-][8] ACCOUNT_LIST_REWARDS_PANEL
  //     [-] [0] CLAIM_PENDING_SPONSOR_COINS
  //         [-] [0] SPONSORS
  //         [+] [1] RECIPIENTS
  //         [+] [2] AGENTS
  //     [+] [1] CLAIM_PENDING_RECIPIENT_COINS
  //         [-] [0] SPONSORS
  //         [+] [1] RECIPIENTS
  //         [+] [2] AGENTS
  //     [+] [2] CLAIM_PENDING_AGENT_COINS
  //         [-] [0] SPONSORS
  //         [+] [1] RECIPIENTS
  //         [+] [2] AGENTS
  //     [+] [3] UNSPONSOR_SP_COINS
  //
  [SPCD.ACCOUNT_LIST_REWARDS_PANEL]: [
    SPCD.CLAIM_PENDING_SPONSOR_COINS,
    SPCD.CLAIM_PENDING_RECIPIENT_COINS,
    SPCD.CLAIM_PENDING_AGENT_COINS,
    SPCD.UNSPONSOR_SP_COINS,
  ],

  // ✅ Each claim panel shows the same mode selectors underneath
  [SPCD.CLAIM_PENDING_SPONSOR_COINS]: [SPCD.SPONSORS, SPCD.RECIPIENTS, SPCD.AGENTS],
  [SPCD.CLAIM_PENDING_RECIPIENT_COINS]: [SPCD.SPONSORS, SPCD.RECIPIENTS, SPCD.AGENTS],
  [SPCD.CLAIM_PENDING_AGENT_COINS]: [SPCD.SPONSORS, SPCD.RECIPIENTS, SPCD.AGENTS],
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

  // ✅ NEW list overlay root
  [SPCD.ACCOUNT_LIST_REWARDS_PANEL]: 'panel',

  // ✅ Mode selectors (appear under each CLAIM_PENDING_* node)
  [SPCD.SPONSORS]: 'panel',
  [SPCD.RECIPIENTS]: 'panel',
  [SPCD.AGENTS]: 'panel',

  // ✅ NEW chevron pending flags (persisted UI state; not a visual panel)
  [SPCD.CHEVRON_DOWN_OPEN_PENDING]: 'control',

  // ✅ OLD list overlays (legacy behavior)
  [SPCD.RECIPIENT_LIST_SELECT_PANEL_OLD]: 'list',
  [SPCD.AGENT_LIST_SELECT_PANEL_OLD]: 'list',

  [SPCD.MANAGE_SPONSORSHIPS_PANEL]: 'panel',

  // ✅ Sub-panels under ACCOUNT_LIST_REWARDS_PANEL
  [SPCD.CLAIM_PENDING_SPONSOR_COINS]: 'panel',
  [SPCD.CLAIM_PENDING_RECIPIENT_COINS]: 'panel',
  [SPCD.CLAIM_PENDING_AGENT_COINS]: 'panel',
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

    // ✅ NEW list overlay root
    SPCD.ACCOUNT_LIST_REWARDS_PANEL,

    // ✅ Mode selectors (now nested under CLAIM_PENDING_* in the GUI tree)
    SPCD.SPONSORS,
    SPCD.RECIPIENTS,
    SPCD.AGENTS,

    // ✅ NEW chevron pending flags (persisted UI state)
    SPCD.CHEVRON_DOWN_OPEN_PENDING,

    // ✅ OLD list overlays
    SPCD.RECIPIENT_LIST_SELECT_PANEL_OLD,
    SPCD.AGENT_LIST_SELECT_PANEL_OLD,

    // ✅ Rewards sub-panels
    SPCD.CLAIM_PENDING_SPONSOR_COINS,
    SPCD.CLAIM_PENDING_RECIPIENT_COINS,
    SPCD.CLAIM_PENDING_AGENT_COINS,
    SPCD.UNSPONSOR_SP_COINS,

    // Detail panels
    SPCD.RECIPIENT_ACCOUNT_PANEL,
    SPCD.AGENT_ACCOUNT_PANEL,
    SPCD.SPONSOR_ACCOUNT_PANEL,

    SPCD.ERROR_MESSAGE_PANEL,
  ] as SPCD[],
};
