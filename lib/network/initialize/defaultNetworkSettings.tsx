// File: @/lib/network/initialize/defaultNetworkSettings.tsx
'use client';

import type {
  TradeData,
  ExchangeContext,
  NetworkElement,
  spCoinAccount,
} from '@/lib/structure';
import {
  TRADE_DIRECTION,
  SP_COIN_DISPLAY,
  API_TRADING_PROVIDER,
} from '@/lib/structure';

import type { SpCoinPanelTree } from '@/lib/structure/exchangeContext/types/PanelNode';
import { defaultSpCoinPanelTree } from '@/lib/structure/exchangeContext/constants/defaultPanelTree';
import { CHAIN_ID } from '@/lib/structure/enums/networkIds';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import {
  getDefaultNetworkSettings,
  normalizeChainId,
} from '@/lib/utils/network';

// displayStack node type (strict shape: [{id,name}])
import type { DISPLAY_STACK_NODE } from '@/lib/structure/types';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_NETWORK_SETTINGS === 'true';
const logger = createDebugLogger('NetworkSettings', DEBUG_ENABLED, LOG_TIME);

const defaultInitialTradeData: TradeData = {
  tradeDirection: TRADE_DIRECTION.SELL_EXACT_OUT,
  sellTokenContract: undefined,
  buyTokenContract: undefined,
  previewTokenContract: undefined,
  previewTokenSource: null,
  rateRatio: 0,
  slippage: {
    bps: 100,
    percentage: 0,
    percentageString: '0.00%',
  },
};

// ---- panel tree helpers ----
function clone<T>(o: T): T {
  return typeof structuredClone === 'function'
    ? structuredClone(o)
    : JSON.parse(JSON.stringify(o));
}

/** Build a default SpCoinPanelTree and exclude CONFIG_SPONSORSHIP_PANEL anywhere in the tree */
function buildDefaultSpCoinPanelTree(): SpCoinPanelTree {
  const tree = clone(defaultSpCoinPanelTree) as SpCoinPanelTree;

  const prune = (nodes: any[]): any[] =>
    nodes
      .filter(
        (n) =>
          n &&
          typeof n.panel === 'number' &&
          n.panel !== SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL,
      )
      .map((n) => {
        if (Array.isArray(n.children) && n.children.length) {
          const kids = prune(n.children);
          return kids.length ? { ...n, children: kids } : { ...n, children: undefined };
        }
        return n;
      });

  return prune(tree) as SpCoinPanelTree;
}

const initialContext = () => {
  const chainId: number = CHAIN_ID.ETHEREUM; // default startup network
  const exchangeContext: ExchangeContext = getInitialContext(chainId);
  logger.log('initialContext Initialized ExchangeContext:', exchangeContext);
  return { exchangeContext };
};

const getInitialContext = (
  chain: number | string | { id: number } | undefined,
): ExchangeContext => {
  const chainId = normalizeChainId(chain);
  const initialContextMap = getInitialContextMap(chainId);
  logger.log(`[getInitialContext] Generating context for chainId: ${chainId}`);

  const exchangeContext: ExchangeContext = {
    network: initialContextMap.get('networkHeader') as NetworkElement,
    accounts: {
      recipientAccount: initialContextMap.get('defaultRecipient') as
        | spCoinAccount
        | undefined,
      agentAccount: initialContextMap.get('defaultAgent') as spCoinAccount | undefined,
      sponsorAccount: undefined,
      sponsorAccounts: [],
      recipientAccounts: [],
      agentAccounts: [],
    },
    tradeData: {
      ...defaultInitialTradeData,
    },
    settings: {
      apiTradingProvider: API_TRADING_PROVIDER.API_0X,

      // satisfy required Settings.spCoinPanelTree with a full tree root
      spCoinPanelTree: buildDefaultSpCoinPanelTree(),

      // REQUIRED by Settings: initialize empty persisted nav stack
      // Contract: DISPLAY_STACK_NODE[] = [{ id, name }]
      displayStack: [] as DISPLAY_STACK_NODE[],
      testPage: {
        TEST_PAGE_EXCHANGE_CONTEXT: true,
        TEST_PAGE_FSM_TRACE: false,
        TEST_PAGE_ACCOUNT_LISTS: false,
        TEST_PAGE_TO_DOS: false,
        TEST_PAGE_TOKEN_LISTS: false,
      },
    },
    errorMessage: undefined,
    apiErrorMessage: undefined,
  };

  logger.log('[getInitialContext] InitialContext constructed:', exchangeContext);
  return exchangeContext;
};

function getInitialContextMap(chain: number) {
  const initialNetworkContext = getDefaultNetworkSettings(chain);
  logger.log(`[getInitialContextMap] Network settings loaded for chain: ${chain}`);
  return new Map(Object.entries(initialNetworkContext));
}

export { getDefaultNetworkSettings, getInitialContext, getInitialContextMap, initialContext };
