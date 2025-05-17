"use client";

import { API_TRADING_PROVIDER, ExchangeContext, TradeData } from "@/lib/structure/types";
import defaultEthereumSettings from "@/resources/data/networks/ethereum/initialize/defaultNetworkSettings.json";
import defaultPolygonSettings from "@/resources/data/networks/polygon/initialize/defaultNetworkSettings.json";
import defaultHardHatSettings from "@/resources/data/networks/hardhat/initialize/defaultNetworkSettings.json";
import defaultSoliditySettings from "@/resources/data/networks/sepolia/initialize/defaultNetworkSettings.json";
import {
  SWAP_TYPE,
  TRADE_DIRECTION,
  NetworkElement,
  WalletAccount,
  SP_COIN_DISPLAY,
  ETHEREUM,
  HARDHAT,
  POLYGON,
  SEPOLIA,
} from "@/lib/structure/types";
import { isLowerCase } from "../network/utils";

const STORAGE_KEY = "exchangeContext";

export const loadStoredExchangeContext = (): ExchangeContext | null => {
  if (typeof window !== "undefined") {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      try {
        return JSON.parse(storedData);
      } catch (error) {
        console.error("Failed to parse stored ExchangeContext:", error);
      }
    }
  }
  return null;
};

export const saveExchangeContext = (contextData: ExchangeContext): void => {
  if (typeof window !== "undefined") {
    const serializedContext = JSON.stringify(contextData, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    );
    localStorage.setItem(STORAGE_KEY, serializedContext);
  }
};

export const getInitialContext = (chainId: number): ExchangeContext => {
  const initialContextMap = getInitialContextMap(chainId);

  return {
    activeAccountAddress: undefined,
    network: initialContextMap.get("networkHeader") as NetworkElement,
    recipientAccount: initialContextMap.get("defaultRecipient") as WalletAccount | undefined,
    agentAccount: initialContextMap.get("defaultAgent") as WalletAccount | undefined,
    apiTradingProvider: API_TRADING_PROVIDER.API_0X,
    tradeData: {
      signer: undefined,
      chainId,
      tradeDirection: TRADE_DIRECTION.SELL_EXACT_OUT,
      swapType: SWAP_TYPE.UNDEFINED,
      slippageBps: 200,
      sellTokenContract: undefined,
      buyTokenContract: undefined,
    },
    spCoinDisplay: SP_COIN_DISPLAY.SHOW_ADD_SPONSOR_BUTTON,
    test: { dumpContextButton: false },
  };
};

export const sanitizeExchangeContext = (
    raw: Partial<ExchangeContext> | null,
    chainId: number
  ): ExchangeContext => {
    const defaultContext = getInitialContext(chainId);
  
    return {
  apiTradingProvider: raw?.apiTradingProvider ?? defaultContext.apiTradingProvider,
  activeAccountAddress: raw?.activeAccountAddress ?? defaultContext.activeAccountAddress,
  network: raw?.network ?? defaultContext.network,
  spCoinDisplay: raw?.spCoinDisplay ?? defaultContext.spCoinDisplay,
  test: raw?.test ?? defaultContext.test,
  recipientAccount: raw?.recipientAccount ?? defaultContext.recipientAccount,
  agentAccount: raw?.agentAccount ?? defaultContext.agentAccount,
  tradeData: {
    chainId: raw?.tradeData?.chainId ?? defaultContext.tradeData.chainId,
    tradeDirection: raw?.tradeData?.tradeDirection ?? defaultContext.tradeData.tradeDirection,
    swapType: raw?.tradeData?.swapType ?? defaultContext.tradeData.swapType,
    slippageBps: raw?.tradeData?.slippageBps !== undefined
      ? raw.tradeData.slippageBps
      : defaultContext.tradeData.slippageBps, // ✅ USE 200 on first load
    sellTokenContract: raw?.tradeData?.sellTokenContract ?? defaultContext.tradeData.sellTokenContract,
    buyTokenContract: raw?.tradeData?.buyTokenContract ?? defaultContext.tradeData.buyTokenContract,
    signer: raw?.tradeData?.signer ?? defaultContext.tradeData.signer,
  },
  containerType: undefined,
  apiTradingProvider: API_TRADING_PROVIDER.API_0X,
  activeAccountAddress: undefined,
  network: {
    chainId: 0,
    logoURL: "",
    name: "",
    symbol: "",
    url: ""
  },
  spCoinDisplay: SP_COIN_DISPLAY.OFF,
  test: {
    dumpContextButton: false
  },
  tradeData: {
    buyTokenContract: undefined,
    chainId: 0,
    sellTokenContract: undefined,
    signer: undefined,
    slippageBps: 0,
    swapType: SWAP_TYPE.SWAP,
    tradeDirection: TRADE_DIRECTION.SELL_EXACT_OUT
  }
};
  };  

function getInitialContextMap(chain: number) {
  const initialNetworkContext = getDefaultNetworkSettings(chain);
  return new Map(Object.entries(initialNetworkContext));
}

const getDefaultNetworkSettings = (chain: any) => {
  if (chain && typeof chain === "string" && !isLowerCase(chain)) {
    chain = chain.toLowerCase();
  } else if (chain && typeof chain !== "number" && typeof chain !== "string") {
    chain = chain.id;
  }

  switch (chain) {
    case ETHEREUM:
    case "ethereum":
      return defaultEthereumSettings;
    case POLYGON:
    case "polygon":
      return defaultPolygonSettings;
    case HARDHAT:
    case "hardhat":
      return defaultHardHatSettings;
    case SEPOLIA:
    case "sepolia":
      return defaultSoliditySettings;
    default:
      return defaultEthereumSettings;
  }
};
