"use client";

import defaultEthereumSettings from "@/resources/data/networks/ethereum/initialize/defaultNetworkSettings.json";
import defaultPolygonSettings from "@/resources/data/networks/polygon/initialize/defaultNetworkSettings.json";
import defaultHardHatSettings from "@/resources/data/networks/hardhat/initialize/defaultNetworkSettings.json";
import defaultSoliditySettings from "@/resources/data/networks/sepolia/initialize/defaultNetworkSettings.json";
import { isLowerCase } from "../utils";
import {
  SWAP_TYPE,
  TRANSACTION_TYPE,
  ExchangeContext,
  NetworkElement,
  WalletAccount,
  TokenContract,
  SP_COIN_DISPLAY,
  ETHEREUM,
  HARDHAT,
  POLYGON,
  SEPOLIA,
} from "@/lib/structure/types";

// Default trade data
const defaultInitialTradeData = {
  signer: undefined,
  chainId: 1,
  transactionType: TRANSACTION_TYPE.SELL_EXACT_OUT,
  swapType: SWAP_TYPE.UNDEFINED,
  sellAmount: 0n,
  buyAmount: 0n,
  slippageBps: 100,
  sellTokenContract: undefined,
  buyTokenContract: undefined,
};

// ✅ Get initial exchange context dynamically
export const getInitialContext = (chainId: number): ExchangeContext => {
  const initialContextMap = getInitialContextMap(chainId);

  return {
    activeAccountAddress: undefined,
    network: initialContextMap.get("networkHeader") as NetworkElement,
    recipientWallet: initialContextMap.get("defaultRecipient") as WalletAccount | undefined,
    agentAccount: initialContextMap.get("defaultAgent") as WalletAccount | undefined,
    tradeData: defaultInitialTradeData,
    spCoinPanels: SP_COIN_DISPLAY.SELECT_BUTTON,
    test: { dumpContextButton: false },
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
