// File: lib/context/helpers/ExchangeInitialContext.ts

import {
  API_TRADING_PROVIDER,
  SP_COIN_DISPLAY,
  TRADE_DIRECTION,
  WalletAccount,
  NetworkElement,
  ExchangeContext,
} from '@/lib/structure';

import { getDefaultNetworkSettings } from '@/lib/network/defaults';

// ✅ Use the tree root default, not the flat array
import { defaultMainPanelNode } from '@/lib/structure/exchangeContext/constants/defaultPanelTree';
import type { MainPanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';

function clone<T>(o: T): T {
  return typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));
}

// Build a default tree and exclude SPONSOR_RATE_CONFIG_PANEL from children
function buildDefaultMainPanelNode(): MainPanelNode {
  const root = clone(defaultMainPanelNode) as MainPanelNode;
  root.children = (root.children ?? []).filter(
    (ch) => ch?.panel !== SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG_PANEL
  );
  return root;
}

export const getInitialContext = (chainId: number): ExchangeContext => {
  const initialContextMap = getInitialContextMap(chainId);

  return {
    network: {
      ...(initialContextMap.get('networkHeader') as NetworkElement),
      connected: false,
    },
    settings: {
      apiTradingProvider: API_TRADING_PROVIDER.API_0X,
      // ✅ must be a MainPanelNode
      mainPanelNode: buildDefaultMainPanelNode(),
    },
    accounts: {
      connectedAccount: undefined,
      sponsorAccount: undefined,
      recipientAccount: initialContextMap.get('defaultRecipient') as WalletAccount | undefined,
      agentAccount: initialContextMap.get('defaultAgent') as WalletAccount | undefined,
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
