// File: lib/context/ExchangeInitialContext.ts
'use client';

import defaultEthereumSettings from '@/resources/data/networks/ethereum/initialize/defaultNetworkSettings.json';
import defaultPolygonSettings from '@/resources/data/networks/polygon/initialize/defaultNetworkSettings.json';
import defaultHardHatSettings from '@/resources/data/networks/hardhat/initialize/defaultNetworkSettings.json';
import defaultSoliditySettings from '@/resources/data/networks/sepolia/initialize/defaultNetworkSettings.json';
import { isLowerCase } from '../utils';
import {
  TradeData,
  TRADE_DIRECTION,
  ExchangeContext,
  NetworkElement,
  WalletAccount,
  SP_COIN_DISPLAY_NEW,
  ETHEREUM,
  HARDHAT,
  POLYGON,
  SEPOLIA,
  API_TRADING_PROVIDER,
} from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME: boolean = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_NETWORK_SETTINGS === 'true';
const logger = createDebugLogger('NetworkSettings', DEBUG_ENABLED, LOG_TIME);

const defaultInitialTradeData: TradeData = {
  tradeDirection: TRADE_DIRECTION.SELL_EXACT_OUT,
  sellTokenContract: undefined,
  buyTokenContract: undefined,
  rateRatio: 0,
  slippage: {
    bps: 100,
    percentage: 0,
    percentageString: '0.00%',
  },
};

const initialContext = () => {
  const chainId: number = 1; // Default startup network to Ethereum
  const exchangeContext: ExchangeContext = getInitialContext(chainId);
  logger.log('🟢 [initialContext] Initialized ExchangeContext:', exchangeContext);
  return { exchangeContext };
};

const getInitialContext = (chain: any | number): ExchangeContext => {
  const chainId: number = chain || 1;
  const initialContextMap = getInitialContextMap(chainId);
  logger.log(`🛠️ [getInitialContext] Generating context for chainId: ${chainId}`);

  const exchangeContext: ExchangeContext = {
    network: initialContextMap.get('networkHeader') as NetworkElement,
    accounts: {
      recipientAccount: initialContextMap.get('defaultRecipient') as WalletAccount | undefined,
      agentAccount: initialContextMap.get('defaultAgent') as WalletAccount | undefined,
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
      activeDisplay: SP_COIN_DISPLAY_NEW.TRADING_STATION_PANEL, // ✅ ONLY activeDisplay kept
    },
    errorMessage: undefined,
    apiErrorMessage: undefined,
  };

  logger.log('✅ [getInitialContext] InitialContext constructed:', exchangeContext);
  return exchangeContext;
};

function getInitialContextMap(chain: any) {
  const initialNetworkContext = getDefaultNetworkSettings(chain);
  logger.log(`📦 [getInitialContextMap] Network settings loaded for chain: ${chain}`);
  return new Map(Object.entries(initialNetworkContext));
}

const getDefaultNetworkSettings = (chain: any) => {
  if (chain && typeof chain === 'string' && !isLowerCase(chain)) {
    chain = chain.toLowerCase();
  } else if (chain && typeof chain !== 'number' && typeof chain !== 'string') {
    chain = chain.id;
  }

  switch (chain) {
    case ETHEREUM:
    case 'ethereum':
      logger.log('🔗 [getDefaultNetworkSettings] Using Ethereum settings');
      return defaultEthereumSettings;
    case POLYGON:
    case 'polygon':
      logger.log('🔗 [getDefaultNetworkSettings] Using Polygon settings');
      return defaultPolygonSettings;
    case HARDHAT:
    case 'hardhat':
      logger.log('🔗 [getDefaultNetworkSettings] Using Hardhat settings');
      return defaultHardHatSettings;
    case SEPOLIA:
    case 'sepolia':
      logger.log('🔗 [getDefaultNetworkSettings] Using Sepolia settings');
      return defaultSoliditySettings;
    default:
      logger.warn('⚠️ [getDefaultNetworkSettings] Unknown chain, defaulting to Ethereum');
      return defaultEthereumSettings;
  }
};

export {
  getDefaultNetworkSettings,
  getInitialContext,
  getInitialContextMap,
  initialContext,
};
