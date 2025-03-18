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

// ✅ Custom hooks for using sellAmount and buyAmount with global state management
export const useSellAmount = () => {
  const context = useExchangeContext();
  return [context.sellAmount, context.setSellAmount] as const;
};

export const useBuyAmount = () => {
  const context = useExchangeContext();
  return [context.buyAmount, context.setBuyAmount] as const;
};

// ✅ Example usage component
export const PriceDisplay = () => {
  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();

  return (
    <div>
      <h2>Sell Amount: {sellAmount.toString()}</h2>
      <h2>Buy Amount: {buyAmount.toString()}</h2>
      <button onClick={() => setSellAmount(sellAmount + BigInt(1))}>Increase Sell Amount</button>
      <button onClick={() => setBuyAmount(buyAmount + BigInt(1))}>Increase Buy Amount</button>
    </div>
  );
};
