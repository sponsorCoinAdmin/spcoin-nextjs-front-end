"use client";

import { API_TRADING_PROVIDER, ExchangeContext, TradeData } from "@/lib/structure/types"; // ✅ Import the type only
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
    SEPOLIA 
} from "@/lib/structure/types";
import { isLowerCase } from "../network/utils";

const STORAGE_KEY = "exchangeContext";

// ✅ Load stored exchange context
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

// ✅ Save exchange context
export const saveExchangeContext = (contextData: ExchangeContext): void => {  // 🔹 Renamed to `contextData` to avoid conflict
    if (typeof window !== "undefined") {
        const serializedContext = JSON.stringify(contextData, (_, value) =>
            typeof value === "bigint" ? value.toString() : value
        );
        localStorage.setItem(STORAGE_KEY, serializedContext);
    }
};

// ✅ Get initial exchange context dynamically
// File: ExchangeHelpers.ts

export const getInitialContext = (chainId: number): ExchangeContext => {
    const initialContextMap = getInitialContextMap(chainId);
  
    return {
      activeAccountAddress: undefined,
      network: initialContextMap.get("networkHeader") as NetworkElement,
      recipientWallet: initialContextMap.get("defaultRecipient") as WalletAccount | undefined,
      agentAccount: initialContextMap.get("defaultAgent") as WalletAccount | undefined,
      apiTradingProvider: API_TRADING_PROVIDER.API_0X,
      tradeData: {
        signer: undefined,
        chainId, // ✅ ensure this is always set
        transactionType: TRADE_DIRECTION.SELL_EXACT_OUT,
        swapType: SWAP_TYPE.UNDEFINED,
        slippageBps: 100,
        sellTokenContract: undefined,
        buyTokenContract: undefined,
      },
      spCoinPanels: SP_COIN_DISPLAY.SELECT_BUTTON,
      test: { dumpContextButton: false },
    };
  };

// File: ExchangeHelpers.ts

// Fallback in case tradeData is partially missing
export const sanitizeExchangeContext = (
  raw: Partial<ExchangeContext> | null,
  chainId: number
): ExchangeContext => {
  const fallbackTradeData: TradeData = {
    chainId,
    transactionType: TRADE_DIRECTION.SELL_EXACT_OUT,
    swapType: SWAP_TYPE.UNDEFINED,
    slippageBps: 100,
    sellTokenContract: undefined,
    buyTokenContract: undefined,
    signer: undefined,
  };

  return {
    apiTradingProvider: API_TRADING_PROVIDER.API_0X,
    activeAccountAddress: undefined,
    network: {
        chainId: 0,
        img: "",
        name: "",
        symbol: "",
        url: ""
    },
    spCoinPanels: SP_COIN_DISPLAY.RECIPIENT_CONTAINER,
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
        transactionType: TRADE_DIRECTION.SELL_EXACT_OUT
    }
};
}; 

// ✅ Get network settings based on chain ID
function getInitialContextMap(chain: number) {
    const initialNetworkContext = getDefaultNetworkSettings(chain);
    return new Map(Object.entries(initialNetworkContext));
}

// ✅ Retrieve default network settings dynamically
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
