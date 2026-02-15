// File: @/lib/context/helpers/initExchangeContext.ts

import type {
  spCoinAccount,
  NetworkElement,
  ExchangeContext,
} from '@/lib/structure';
import {
  API_TRADING_PROVIDER,
  TRADE_DIRECTION,
} from '@/lib/structure';

import { getDefaultNetworkSettings } from '@/lib/network/defaults';
import { defaultSpCoinPanelTree } from '@/lib/structure/exchangeContext/constants/defaultPanelTree';
import type { SpCoinPanelTree } from '@/lib/structure/exchangeContext/types/PanelNode';

// ✅ displayStack node type (strict shape: [{id,name}])
import type { DISPLAY_STACK_NODE } from '@/lib/structure/types';

function clone<T>(o: T): T {
  return typeof structuredClone === 'function'
    ? structuredClone(o)
    : JSON.parse(JSON.stringify(o));
}

const buildDefaultSpCoinPanelTree = (): SpCoinPanelTree => {
  const root = clone(defaultSpCoinPanelTree);
  // no filtering needed; keep shallow children as-is
  return root;
};

export const getInitialContext = (chainId: number): ExchangeContext => {
  // Interpret the argument as the *app* chain id
  const effectiveAppChainId =
    typeof chainId === 'number' && chainId > 0 ? chainId : 0;

  const initialContextMap = getInitialContextMap(effectiveAppChainId);
  const header =
    (initialContextMap.get('networkHeader') as NetworkElement) ??
    ({} as NetworkElement);

  return {
    network: {
      // ✅ IDs: single source of truth — argument only
      appChainId: effectiveAppChainId,
      chainId: effectiveAppChainId,

      // ✅ Start disconnected; connection state is managed elsewhere
      connected: false,

      // ✅ Branding only from JSON (ignore any ids in the JSON)
      logoURL: header.logoURL,
      name: header.name,
      symbol: header.symbol,
      url: header.url,
    },
    settings: {
      apiTradingProvider: API_TRADING_PROVIDER.API_0X,

      // ✅ a SpCoinPanelTree, not an array
      spCoinPanelTree: buildDefaultSpCoinPanelTree(),

      // ✅ REQUIRED by Settings: initialize empty persisted nav stack
      // Contract: DISPLAY_STACK_NODE[] = [{ id, name }]
      displayStack: [] as DISPLAY_STACK_NODE[],
      showTestNets: false,
      testPage: {
        TEST_PAGE_EXCHANGE_CONTEXT: true,
        TEST_PAGE_FSM_TRACE: false,
        TEST_PAGE_ACCOUNT_LISTS: false,
        TEST_PAGE_TO_DOS: false,
      },
    },
    accounts: {
      // 🔹 Wallet-linked account (mirrors wagmi connection)
      activeAccount: undefined,

      sponsorAccount: undefined,
      recipientAccount: initialContextMap.get('defaultRecipient') as
        | spCoinAccount
        | undefined,
      agentAccount: initialContextMap.get('defaultAgent') as
        | spCoinAccount
        | undefined,
      sponsorAccounts: [],
      recipientAccounts: [],
      agentAccounts: [],
    },
    tradeData: {
      tradeDirection: TRADE_DIRECTION.SELL_EXACT_OUT,
      sellTokenContract: undefined,
      buyTokenContract: undefined,
      previewTokenContract: undefined,
      previewTokenSource: null,
      rateRatio: 1,
      slippage: {
        bps: 200,
        percentage: 2,
        percentageString: '2.00%',
      },
    },
    errorMessage: undefined,
    apiErrorMessage: undefined,
  };
};

function getInitialContextMap(chain: number) {
  const initialNetworkContext = getDefaultNetworkSettings(chain);
  return new Map(Object.entries(initialNetworkContext));
}
