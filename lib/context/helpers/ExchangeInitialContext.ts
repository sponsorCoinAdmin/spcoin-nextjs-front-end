import {
  API_TRADING_PROVIDER,
  SP_COIN_DISPLAY,
  TRADE_DIRECTION,
  WalletAccount,
  NetworkElement,
  ExchangeContext,
} from '@/lib/structure';

import { getDefaultNetworkSettings } from '@/lib/network/defaults';

export const getInitialContext = (chainId: number): ExchangeContext => {
  const initialContextMap = getInitialContextMap(chainId);

  return {
    network: {
      ...(initialContextMap.get('networkHeader') as NetworkElement),
      connected: false,
    },
    settings: {
      apiTradingProvider: API_TRADING_PROVIDER.API_0X,
      spCoinDisplay: SP_COIN_DISPLAY.EXCHANGE_ROOT,
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
        percentage: 0,
        percentageString: '0.00%',
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
