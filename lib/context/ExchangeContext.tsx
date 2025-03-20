"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useChainId } from "wagmi";
import {
  getInitialContext,
  saveExchangeContext,
  loadStoredExchangeContext,
} from "@/lib/context/ExchangeHelpers";
import { ExchangeContext, TRADE_DIRECTION, TokenContract } from "@/lib/structure/types";
import { stringifyBigInt } from "../spCoin/utils";

// ✅ Define Context Type
type ExchangeContextType = {
  exchangeContext: ExchangeContext;
  setExchangeContext: (context: ExchangeContext) => void;
  sellAmount: bigint;
  setSellAmount: (amount: bigint) => void;
  buyAmount: bigint;
  setBuyAmount: (amount: bigint) => void;
  transactionType: TRADE_DIRECTION;
  setTransDirection: (type: TRADE_DIRECTION) => void;
  slippageBps: number;
  setSlippageBps: (bps: number) => void;
  sellTokenContract: TokenContract | undefined;
  setSellTokenContract: (contract: TokenContract | undefined) => void;
  buyTokenContract: TokenContract | undefined;
  setBuyTokenContract: (contract: TokenContract | undefined) => void;
};

// ✅ Create Context
const ExchangeContextState = createContext<ExchangeContextType | null>(null);

// ✅ Provider Component
export function ExchangeWrapper({ children }: { children: React.ReactNode }) {
  const chainId = useChainId();
  const [exchangeContext, setExchangeContext] = useState<ExchangeContext | null>(null);
  const [sellAmount, setSellAmount] = useState<bigint>(BigInt(0));
  const [buyAmount, setBuyAmount] = useState<bigint>(BigInt(0));
  const [transactionType, setTransactionTypeState] = useState<TRADE_DIRECTION>(
    exchangeContext?.tradeData?.transactionType ?? TRADE_DIRECTION.BUY_EXACT_IN
  );
  const [slippageBps, setSlippageBps] = useState<number>(exchangeContext?.tradeData?.slippageBps ?? 0);
  const [sellTokenContract, setSellTokenContract] = useState<TokenContract | undefined>(exchangeContext?.tradeData?.sellTokenContract ?? undefined);
  const [buyTokenContract, setBuyTokenContract] = useState<TokenContract | undefined>(exchangeContext?.tradeData?.buyTokenContract ?? undefined);

  // ✅ Custom function to update `transactionType` and `exchangeContext`
  const setTransDirection = (type: TRADE_DIRECTION) => {
    setTransactionTypeState(type);

    setExchangeContext((prevContext) => {
      if (!prevContext) return prevContext; // If context is null, return it unchanged

      return {
        ...prevContext,
        tradeData: {
          ...prevContext.tradeData,
          transactionType: type, // Update tradeData.transactionType
        },
      };
    });
  };

  // ✅ Load initial context once `chainId` is available
  useEffect(() => {
    if (chainId) {
      console.log("🔍 Initializing ExchangeContext with chainId:", chainId);
      const storedContext = loadStoredExchangeContext();
      const initialContext = storedContext || getInitialContext(chainId);
      setExchangeContext(initialContext);
    }
  }, [chainId]);

  // ✅ Sync state with tradeData, handling potential undefined values
  useEffect(() => {
    if (exchangeContext?.tradeData) {
      setSellAmount(exchangeContext.tradeData.sellTokenContract?.amount ?? BigInt(0));
      setBuyAmount(exchangeContext.tradeData.buyTokenContract?.amount ?? BigInt(0));
      setTransactionTypeState(exchangeContext.tradeData.transactionType ?? TRADE_DIRECTION.BUY_EXACT_IN);
      setSlippageBps(exchangeContext.tradeData.slippageBps ?? 0);
      setSellTokenContract(exchangeContext.tradeData.sellTokenContract ?? undefined);
      setBuyTokenContract(exchangeContext.tradeData.buyTokenContract ?? undefined);
    }
  }, [exchangeContext]);

  if (!exchangeContext) {
    return null; // Render nothing until `exchangeContext` is ready
  }

  return (
    <ExchangeContextState.Provider
      value={{
        exchangeContext,
        setExchangeContext,
        sellAmount,
        setSellAmount,
        buyAmount,
        setBuyAmount,
        transactionType,
        setTransDirection,
        slippageBps,
        setSlippageBps,
        sellTokenContract,
        setSellTokenContract,
        buyTokenContract,
        setBuyTokenContract,
      }}
    >
      {children}
    </ExchangeContextState.Provider>
  );
}

// ✅ Hook to use Exchange Context
export const useExchangeContext = () => {
  const context = useContext(ExchangeContextState);
  if (!context) {
    throw new Error("useExchangeContext must be used within an ExchangeWrapper.");
  }
  return context;
};

// ✅ Hook to get `tradeData`
export const useTradeData = () => {
  const { exchangeContext } = useExchangeContext();
  if (!exchangeContext) {
    throw new Error("useTradeData must be used within an ExchangeWrapper.");
  }
  return exchangeContext.tradeData;
};

// ✅ Custom hooks for using various exchange values
export const useSellAmount = () => {
  const context = useExchangeContext();
  return [context.sellAmount, context.setSellAmount] as [bigint, (amount: bigint) => void];
};

export const useBuyAmount = () => {
  const context = useExchangeContext();
  return [context.buyAmount, context.setBuyAmount] as [bigint, (amount: bigint) => void];
};

export const useTransactionType = () => {
  const context = useExchangeContext();
  return [context.transactionType, context.setTransDirection] as [TRADE_DIRECTION, (type: TRADE_DIRECTION) => void];
};

export const useSlippageBps = () => {
  const context = useExchangeContext();
  return [context.slippageBps, context.setSlippageBps] as [number, (bps: number) => void];
};

export const useSellTokenContract = () => {
  const context = useExchangeContext();
  return [context.sellTokenContract, context.setSellTokenContract] as [TokenContract | undefined, (contract: TokenContract | undefined) => void];
};

export const useBuyTokenContract = () => {
  const context = useExchangeContext();
  return [context.buyTokenContract, context.setBuyTokenContract] as [TokenContract | undefined, (contract: TokenContract | undefined) => void];
};

// ✅ Example Usage Component (Original `PriceDisplay`)
export const PriceDisplay = () => {
  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [transactionType, setTransDirection] = useTransactionType();
  const [slippageBps, setSlippageBps] = useSlippageBps();
  const [sellTokenContract, setSellTokenContract] = useSellTokenContract();
  const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();

  return (
    <div>
      <h2>Sell Amount: {sellAmount.toString()}</h2>
      <h2>Buy Amount: {buyAmount.toString()}</h2>
      <h2>Transaction Type: {transactionType}</h2>
      <h2>Slippage Bps: {slippageBps}</h2>
      <h2>Sell Token Contract: {sellTokenContract?.symbol ?? "None"}</h2>
      <h2>Buy Token Contract: {buyTokenContract?.symbol ?? "None"}</h2>
      <button onClick={() => setTransDirection(TRADE_DIRECTION.SELL_EXACT_OUT)}>
        Change to SELL_EXACT_OUT
      </button>
      <button onClick={() => setTransDirection(TRADE_DIRECTION.BUY_EXACT_IN)}>
        Change to BUY_EXACT_IN
      </button>
    </div>
  );
};
