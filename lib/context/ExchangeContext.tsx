"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useChainId } from "wagmi";
import {
  getInitialContext,
  saveExchangeContext,
  loadStoredExchangeContext,
} from "@/lib/context/ExchangeHelpers";
import { ExchangeContext } from "@/lib/structure/types";

// ✅ Define Context Type
type ExchangeContextType = {
  exchangeContext: ExchangeContext;
  setExchangeContext: (context: ExchangeContext) => void;
  sellAmount: bigint;
  setSellAmount: (amount: bigint) => void;
  buyAmount: bigint;
  setBuyAmount: (amount: bigint) => void;
};

// ✅ Create Context
const ExchangeContextState = createContext<ExchangeContextType | null>(null);

// ✅ Provider Component
export function ExchangeWrapper({ children }: { children: React.ReactNode }) {
  const chainId = useChainId(); // ✅ Hook is at the top level

  // ✅ Start with stored context, but wait for `chainId` before initializing a new one
  const [exchangeContext, setExchangeContext] = useState<ExchangeContext | null>(null);
  const [sellAmount, setSellAmount] = useState<bigint>(BigInt(0));
  const [buyAmount, setBuyAmount] = useState<bigint>(BigInt(0));

  // ✅ Load initial context once `chainId` is available
  useEffect(() => {
    if (chainId) {
      console.log("🔍 Initializing ExchangeContext with chainId:", chainId);
      const storedContext = loadStoredExchangeContext();
      const initialContext = storedContext || getInitialContext(chainId);
      setExchangeContext(initialContext);
    }
  }, [chainId]);

  // ✅ Ensure we don’t render the provider with `null` context
  if (!exchangeContext) {
    return null; // Render nothing until `exchangeContext` is ready
  }

  return (
    <ExchangeContextState.Provider
      value={{ exchangeContext, setExchangeContext, sellAmount, setSellAmount, buyAmount, setBuyAmount }}
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

export const useTradeData = () => {
  const { exchangeContext } = useExchangeContext();
  if (!exchangeContext) {
    throw new Error("useTradeData must be used within a Wrapper.");
  }
  return exchangeContext.tradeData;
};

// ✅ Custom hooks for using sellAmount and buyAmount with initial value like useState
export const useSellAmount = (initialAmount: bigint = BigInt(0)) => {
  const context = useExchangeContext();
  const [localSellAmount, setLocalSellAmount] = useState<bigint>(context.sellAmount || initialAmount);

  useEffect(() => {
    context.setSellAmount(localSellAmount);
  }, [localSellAmount]);

  return [localSellAmount, setLocalSellAmount] as const;
};

export const useBuyAmount = (initialAmount: bigint = BigInt(0)) => {
  const context = useExchangeContext();
  const [localBuyAmount, setLocalBuyAmount] = useState<bigint>(context.buyAmount || initialAmount);

  useEffect(() => {
    context.setBuyAmount(localBuyAmount);
  }, [localBuyAmount]);

  return [localBuyAmount, setLocalBuyAmount] as const;
};
