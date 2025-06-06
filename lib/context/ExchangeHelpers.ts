// File: lib/context/ExchangeHelpers.ts

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
} from '@/lib/structure';

import defaultEthereumSettings from '@/resources/data/networks/ethereum/initialize/defaultNetworkSettings.json';
import defaultPolygonSettings from '@/resources/data/networks/polygon/initialize/defaultNetworkSettings.json';
import defaultHardHatSettings from '@/resources/data/networks/hardhat/initialize/defaultNetworkSettings.json';
import defaultSoliditySettings from '@/resources/data/networks/sepolia/initialize/defaultNetworkSettings.json';

import { createDebugLogger } from '@/lib/utils/debugLogger';

const STORAGE_KEY = 'exchangeContext';
const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_WRAPPER === 'true';
const debugLog = createDebugLogger('ExchangeHelpers', DEBUG_ENABLED, LOG_TIME);

export const loadStoredExchangeContext = (): ExchangeContext | null => {
  if (typeof window !== 'undefined') {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      debugLog.log(`🔑 Loading exchangeContext with key: ${STORAGE_KEY}`);
      if (storedData) {
        const parsed = JSON.parse(storedData, (_key, value) => {
          return typeof value === 'string' && /^\d+n?$/.test(value)
            ? BigInt(value.replace(/n$/, ''))
            : value;
        });
        debugLog.log('📥 Loaded exchangeContext from localStorage');
        return parsed;
      } else {
        debugLog.warn('⚠️ No stored exchangeContext found');
      }
    } catch (err) {
      debugLog.error('❌ Failed to load exchangeContext from localStorage', err);
    }
  }
  return null;
};

export const saveExchangeContext = (contextData: ExchangeContext): void => {
  if (typeof window !== 'undefined') {
    try {
      debugLog.log(`📦 Saving exchangeContext to localStorage under key: ${STORAGE_KEY}`);
      const serializedContext = JSON.stringify(contextData, (_key, value) => {
        if (typeof value === 'bigint') {
          return value.toString();
        }
        return value;
      });
      debugLog.log('🧾 Serialized exchangeContext:', serializedContext);
      localStorage.setItem(STORAGE_KEY, serializedContext);
      debugLog.log('✅ exchangeContext successfully saved');
    } catch (err) {
      debugLog.error('❌ Failed to save exchangeContext to localStorage', err);
    }
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
  if (!raw) {
    debugLog.warn('⚠️ sanitizeExchangeContext received null — returning defaults');
    return defaultContext;
  }

  return {
    settings: {
      apiTradingProvider: raw.settings?.apiTradingProvider ?? defaultContext.settings.apiTradingProvider,
      spCoinDisplay: raw.settings?.spCoinDisplay ?? defaultContext.settings.spCoinDisplay,
    },
    network: raw.network ?? defaultContext.network,
    accounts: {
      signer: raw.accounts?.signer ?? defaultContext.accounts.signer,
      connectedAccount: raw.accounts?.connectedAccount ?? defaultContext.accounts.connectedAccount,
      sponsorAccount: raw.accounts?.sponsorAccount ?? defaultContext.accounts.sponsorAccount,
      recipientAccount: raw.accounts?.recipientAccount ?? defaultContext.accounts.recipientAccount,
      agentAccount: raw.accounts?.agentAccount ?? defaultContext.accounts.agentAccount,
      sponsorAccounts: raw.accounts?.sponsorAccounts ?? defaultContext.accounts.sponsorAccounts,
      recipientAccounts: raw.accounts?.recipientAccounts ?? defaultContext.accounts.recipientAccounts,
      agentAccounts: raw.accounts?.agentAccounts ?? defaultContext.accounts.agentAccounts,
    },
    tradeData: {
      tradeDirection: raw.tradeData?.tradeDirection ?? defaultContext.tradeData.tradeDirection,
      sellTokenContract: raw.tradeData?.sellTokenContract ?? defaultContext.tradeData.sellTokenContract,
      buyTokenContract: raw.tradeData?.buyTokenContract ?? defaultContext.tradeData.buyTokenContract,
      rateRatio: raw.tradeData?.rateRatio ?? defaultContext.tradeData.rateRatio,
      slippage: {
        bps: raw.tradeData?.slippage?.bps ?? defaultContext.tradeData.slippage.bps,
        percentage: raw.tradeData?.slippage?.percentage ?? defaultContext.tradeData.slippage.percentage,
        percentageString:
          raw.tradeData?.slippage?.percentageString ?? defaultContext.tradeData.slippage.percentageString,
      },
    },
    errorMessage: raw.errorMessage ?? defaultContext.errorMessage,
    apiErrorMessage: raw.apiErrorMessage ?? defaultContext.apiErrorMessage,
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
