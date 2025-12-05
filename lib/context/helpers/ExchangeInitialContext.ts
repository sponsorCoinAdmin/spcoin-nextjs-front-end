// File: @/lib/context/helpers/initExchangeContext.ts

import type {
  WalletAccount,
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
  const effectiveAppChainId = typeof chainId === 'number' && chainId > 0 ? chainId : 0;

  const initialContextMap = getInitialContextMap(effectiveAppChainId);
  const header = (initialContextMap.get('networkHeader') as NetworkElement) ?? ({} as NetworkElement);

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
      spCoinPanelTree: buildDefaultSpCoinPanelTree(), // ✅ a SpCoinPanelTree, not an array
    },
    accounts: {
      // 🔹 Wallet-linked account (mirrors wagmi connection)
      activeAccount: undefined,

      sponsorAccount: undefined,
      recipientAccount: initialContextMap.get('defaultRecipient') as
        | WalletAccount
        | undefined,
      agentAccount: initialContextMap.get('defaultAgent') as
        | WalletAccount
        | undefined,
      sponsorAccounts: [],
      recipientAccounts: [],
      agentAccounts: [],
    },
    tradeData: {
      tradeDirection: TRADE_DIRECTION.SELL_EXACT_OUT,
      sellTokenContract: undefined,
      buyTokenContract: undefined,
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
