// File: lib/network/initialize/defaultNetworkSettings.tsx

'use client';

import defaultEthereumSettings from '@/resources/data/networks/ethereum/initialize/defaultNetworkSettings.json';
import defaultPolygonSettings  from '@/resources/data/networks/polygon/initialize/defaultNetworkSettings.json';
import defaultHardHatSettings  from '@/resources/data/networks/hardhat/initialize/defaultNetworkSettings.json';
import defaultSepoliaSettings  from '@/resources/data/networks/sepolia/initialize/defaultNetworkSettings.json';

import {
  TradeData,
  TRADE_DIRECTION,
  ExchangeContext,
  NetworkElement,
  WalletAccount,
  SP_COIN_DISPLAY,
  API_TRADING_PROVIDER,
} from '@/lib/structure';
import type { MainPanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';
import { defaultMainPanelNode } from '@/lib/structure/exchangeContext/constants/defaultPanelTree';
import { CHAIN_ID } from '@/lib/structure/enums/networkIds';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
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

// ---- panel tree helpers ----
function clone<T>(o: T): T {
  return typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));
}

/** Build a default MainPanelNode and exclude RECIPIENT_CONFIG_PANEL from children */
function buildDefaultMainPanelNode(): MainPanelNode {
  const root = clone(defaultMainPanelNode) as MainPanelNode;
  root.children = (root.children ?? []).filter(
    (ch) => ch?.panel !== SP_COIN_DISPLAY.RECIPIENT_CONFIG_PANEL
  );
  return root;
}

const initialContext = () => {
  const chainId: number = CHAIN_ID.ETHEREUM; // default startup network
  const exchangeContext: ExchangeContext = getInitialContext(chainId);
  logger.log('🟢 [initialContext] Initialized ExchangeContext:', exchangeContext);
  return { exchangeContext };
};

const getInitialContext = (chain: number | string | { id: number } | undefined): ExchangeContext => {
  const chainId = normalizeChainId(chain);
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
      // ✅ satisfy required Settings.mainPanelNode with a full tree root
      mainPanelNode: buildDefaultMainPanelNode(),
    },
    errorMessage: undefined,
    apiErrorMessage: undefined,
  };

  logger.log('✅ [getInitialContext] InitialContext constructed:', exchangeContext);
  return exchangeContext;
};

function getInitialContextMap(chain: number) {
  const initialNetworkContext = getDefaultNetworkSettings(chain);
  logger.log(`📦 [getInitialContextMap] Network settings loaded for chain: ${chain}`);
  return new Map(Object.entries(initialNetworkContext));
}

/** Accepts number | string | {id:number}, returns a numeric CHAIN_ID. Defaults to ETHEREUM. */
function normalizeChainId(chain: number | string | { id: number } | undefined): number {
  if (typeof chain === 'number' && Number.isFinite(chain)) return chain;

  if (typeof chain === 'object' && chain && typeof chain.id === 'number') {
    return chain.id;
  }

  if (typeof chain === 'string') {
    const key = chain.toLowerCase();
    switch (key) {
      case 'ethereum':
      case 'mainnet':
      case 'eth':
        return CHAIN_ID.ETHEREUM;
      case 'polygon':
      case 'matic':
        return CHAIN_ID.POLYGON;
      case 'hardhat':
        return CHAIN_ID.HARDHAT;
      case 'sepolia':
        return CHAIN_ID.SEPOLIA;
      case 'base':
        return CHAIN_ID.BASE;
      case 'goerli':
        return CHAIN_ID.GOERLI;
      default:
        return CHAIN_ID.ETHEREUM;
    }
  }

  return CHAIN_ID.ETHEREUM;
}

const getDefaultNetworkSettings = (chain: number) => {
  switch (chain) {
    case CHAIN_ID.ETHEREUM:
      logger.log('🔗 [getDefaultNetworkSettings] Using Ethereum settings');
      return defaultEthereumSettings;
    case CHAIN_ID.POLYGON:
      logger.log('🔗 [getDefaultNetworkSettings] Using Polygon settings');
      return defaultPolygonSettings;
    case CHAIN_ID.HARDHAT:
      logger.log('🔗 [getDefaultNetworkSettings] Using Hardhat settings');
      return defaultHardHatSettings;
    case CHAIN_ID.SEPOLIA:
      logger.log('🔗 [getDefaultNetworkSettings] Using Sepolia settings');
      return defaultSepoliaSettings;
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
