// File: lib/context/ExchangeHelpers.ts

"use client";

import {
  API_TRADING_PROVIDER,
  TradeData,
  WalletAccount,
  SP_COIN_DISPLAY,
  ETHEREUM,
  HARDHAT,
  POLYGON,
  SEPOLIA,
  CONTAINER_TYPE,
  TRADE_DIRECTION,
  SWAP_TYPE,
  NetworkElement,
} from "@/lib/structure/types";

import defaultEthereumSettings from "@/resources/data/networks/ethereum/initialize/defaultNetworkSettings.json";
import defaultPolygonSettings from "@/resources/data/networks/polygon/initialize/defaultNetworkSettings.json";
import defaultHardHatSettings from "@/resources/data/networks/hardhat/initialize/defaultNetworkSettings.json";
import defaultSoliditySettings from "@/resources/data/networks/sepolia/initialize/defaultNetworkSettings.json";

import { isLowerCase } from "../network/utils";

const STORAGE_KEY = "exchangeContext";

export type Accounts = {
  connectedAccount?: WalletAccount;
  sponsorAccount?: WalletAccount;
  recipientAccount?: WalletAccount;
  agentAccount?: WalletAccount;

  sponsorAccounts?: WalletAccount[];
  recipientAccounts?: WalletAccount[];
  agentAccounts?: WalletAccount[];
};

export type Settings = {
  containerType: CONTAINER_TYPE | undefined;
  readonly apiTradingProvider: API_TRADING_PROVIDER;
  readonly spCoinDisplay: SP_COIN_DISPLAY;
};

export type ExchangeContext = {
  settings: Settings;
  accounts: Accounts;
  network: NetworkElement;
  tradeData: TradeData;
};

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
    network: initialContextMap.get("networkHeader") as NetworkElement,
    settings: {
      apiTradingProvider: API_TRADING_PROVIDER.API_0X,
      spCoinDisplay: SP_COIN_DISPLAY.OFF,
      containerType: CONTAINER_TYPE.UNDEFINED,
    },
    accounts: {
      connectedAccount: undefined,
      sponsorAccount: undefined,
      recipientAccount: initialContextMap.get("defaultRecipient") as WalletAccount | undefined,
      agentAccount: initialContextMap.get("defaultAgent") as WalletAccount | undefined,

      sponsorAccounts: [],
      recipientAccounts: [],
      agentAccounts: [],
    },
    tradeData: {
      signer: undefined,
      chainId,
      tradeDirection: TRADE_DIRECTION.SELL_EXACT_OUT,
      swapType: SWAP_TYPE.UNDEFINED,
      slippageBps: 200,
      sellTokenContract: undefined,
      buyTokenContract: undefined,
      rateRatio: 1,
      slippage: 0,
      slippagePercentage: 0,
      slippagePercentageString: "0.00%",
    },
  };
};

export const sanitizeExchangeContext = (
  raw: { tradeData?: Partial<TradeData> } & Partial<ExchangeContext> | null,
  chainId: number
): ExchangeContext => {
  const defaultContext = getInitialContext(chainId);

  return {
    settings: {
      containerType: raw?.settings?.containerType ?? defaultContext.settings.containerType,
      apiTradingProvider: raw?.settings?.apiTradingProvider ?? defaultContext.settings.apiTradingProvider,
      spCoinDisplay: raw?.settings?.spCoinDisplay ?? defaultContext.settings.spCoinDisplay,
    },
    network: raw?.network ?? defaultContext.network,
    accounts: {
      connectedAccount: raw?.accounts?.connectedAccount ?? defaultContext.accounts.connectedAccount,
      sponsorAccount: raw?.accounts?.sponsorAccount ?? defaultContext.accounts.sponsorAccount,
      recipientAccount: raw?.accounts?.recipientAccount ?? defaultContext.accounts.recipientAccount,
      agentAccount: raw?.accounts?.agentAccount ?? defaultContext.accounts.agentAccount,

      sponsorAccounts: raw?.accounts?.sponsorAccounts ?? defaultContext.accounts.sponsorAccounts,
      recipientAccounts: raw?.accounts?.recipientAccounts ?? defaultContext.accounts.recipientAccounts,
      agentAccounts: raw?.accounts?.agentAccounts ?? defaultContext.accounts.agentAccounts,
    },
    tradeData: {
      chainId: raw?.tradeData?.chainId ?? defaultContext.tradeData.chainId,
      tradeDirection: raw?.tradeData?.tradeDirection ?? defaultContext.tradeData.tradeDirection,
      swapType: raw?.tradeData?.swapType ?? defaultContext.tradeData.swapType,
      slippageBps:
        typeof raw?.tradeData?.slippageBps === "number" && raw.tradeData.slippageBps > 0
          ? raw.tradeData.slippageBps
          : defaultContext.tradeData.slippageBps,
      sellTokenContract: raw?.tradeData?.sellTokenContract ?? defaultContext.tradeData.sellTokenContract,
      buyTokenContract: raw?.tradeData?.buyTokenContract ?? defaultContext.tradeData.buyTokenContract,
      signer: raw?.tradeData?.signer ?? defaultContext.tradeData.signer,
      rateRatio: raw?.tradeData?.rateRatio ?? defaultContext.tradeData.rateRatio,
      slippage: raw?.tradeData?.slippage ?? defaultContext.tradeData.slippage,
      slippagePercentage: raw?.tradeData?.slippagePercentage ?? defaultContext.tradeData.slippagePercentage,
      slippagePercentageString: raw?.tradeData?.slippagePercentageString ?? defaultContext.tradeData.slippagePercentageString,
    },
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

const normalizeChainId = (chain: unknown): number | string => {
  if (typeof chain === "number") return chain;
  if (typeof chain === "string") return chain.toLowerCase();
  if (typeof chain === "object" && chain && "id" in chain) return (chain as any).id;
  return ETHEREUM;
};
