'use client';

import {
  API_TRADING_PROVIDER,
  TradeData,
  WalletAccount,
  SP_COIN_DISPLAY,
  ETHEREUM,
  HARDHAT,
  POLYGON,
  SEPOLIA,
  TRADE_DIRECTION,
  NetworkElement,
  ExchangeContext,
} from '@/lib/structure/types';

import defaultEthereumSettings from '@/resources/data/networks/ethereum/initialize/defaultNetworkSettings.json';
import defaultPolygonSettings from '@/resources/data/networks/polygon/initialize/defaultNetworkSettings.json';
import defaultHardHatSettings from '@/resources/data/networks/hardhat/initialize/defaultNetworkSettings.json';
import defaultSoliditySettings from '@/resources/data/networks/sepolia/initialize/defaultNetworkSettings.json';

const STORAGE_KEY = 'exchangeContext';

export const loadStoredExchangeContext = (): ExchangeContext | null => {
  if (typeof window !== 'undefined') {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      try {
        return JSON.parse(storedData);
      } catch (error) {
        console.error('Failed to parse stored ExchangeContext:', error);
      }
    }
  }
  return null;
};

export const saveExchangeContext = (contextData: ExchangeContext): void => {
  if (typeof window !== 'undefined') {
    const serializedContext = JSON.stringify(contextData, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
    localStorage.setItem(STORAGE_KEY, serializedContext);
  }
};

export const getInitialContext = (chainId: number): ExchangeContext => {
  const initialContextMap = getInitialContextMap(chainId);

  return {
    network: initialContextMap.get('networkHeader') as NetworkElement,
    settings: {
      apiTradingProvider: API_TRADING_PROVIDER.API_0X,
      spCoinDisplay: SP_COIN_DISPLAY.EXCHANGE_ROOT,
    },
    accounts: {
      signer: undefined,

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

export const sanitizeExchangeContext = (
  raw: { tradeData?: Partial<TradeData> } & Partial<ExchangeContext> | null,
  chainId: number
): ExchangeContext => {
  const defaultContext = getInitialContext(chainId);

  return {
    settings: {
      apiTradingProvider: raw?.settings?.apiTradingProvider ?? defaultContext.settings.apiTradingProvider,
      spCoinDisplay: raw?.settings?.spCoinDisplay ?? defaultContext.settings.spCoinDisplay,
    },
    network: raw?.network ?? defaultContext.network,
    accounts: {
      signer: raw?.accounts?.signer ?? defaultContext.accounts.signer,

      connectedAccount: raw?.accounts?.connectedAccount ?? defaultContext.accounts.connectedAccount,
      sponsorAccount: raw?.accounts?.sponsorAccount ?? defaultContext.accounts.sponsorAccount,
      recipientAccount: raw?.accounts?.recipientAccount ?? defaultContext.accounts.recipientAccount,
      agentAccount: raw?.accounts?.agentAccount ?? defaultContext.accounts.agentAccount,

      sponsorAccounts: raw?.accounts?.sponsorAccounts ?? defaultContext.accounts.sponsorAccounts,
      recipientAccounts: raw?.accounts?.recipientAccounts ?? defaultContext.accounts.recipientAccounts,
      agentAccounts: raw?.accounts?.agentAccounts ?? defaultContext.accounts.agentAccounts,
    },
    tradeData: {
      tradeDirection: raw?.tradeData?.tradeDirection ?? defaultContext.tradeData.tradeDirection,
      sellTokenContract: raw?.tradeData?.sellTokenContract ?? defaultContext.tradeData.sellTokenContract,
      buyTokenContract: raw?.tradeData?.buyTokenContract ?? defaultContext.tradeData.buyTokenContract,
      rateRatio: raw?.tradeData?.rateRatio ?? defaultContext.tradeData.rateRatio,
      slippage: {
        bps: raw?.tradeData?.slippage?.bps ?? defaultContext.tradeData.slippage.bps,
        percentage: raw?.tradeData?.slippage?.percentage ?? defaultContext.tradeData.slippage.percentage,
        percentageString:
          raw?.tradeData?.slippage?.percentageString ?? defaultContext.tradeData.slippage.percentageString,
      },
    },
    errorMessage: raw?.errorMessage ?? defaultContext.errorMessage,
    apiErrorMessage: raw?.apiErrorMessage ?? defaultContext.apiErrorMessage,
  };
};

function getInitialContextMap(chain: number) {
  const initialNetworkContext = getDefaultNetworkSettings(chain);
  return new Map(Object.entries(initialNetworkContext));
}

const getDefaultNetworkSettings = (chain: any) => {
  const normalized = normalizeChainId(chain);

  switch (normalized) {
    case ETHEREUM:
    case 'ethereum':
      return defaultEthereumSettings;
    case POLYGON:
    case 'polygon':
      return defaultPolygonSettings;
    case HARDHAT:
    case 'hardhat':
      return defaultHardHatSettings;
    case SEPOLIA:
    case 'sepolia':
      return defaultSoliditySettings;
    default:
      return defaultEthereumSettings;
  }
};

const normalizeChainId = (chain: unknown): number | string => {
  if (typeof chain === 'number') return chain;
  if (typeof chain === 'string') return chain.toLowerCase();
  if (typeof chain === 'object' && chain && 'id' in chain) return (chain as any).id;
  return ETHEREUM;
};
