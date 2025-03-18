"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useChainId } from "wagmi";
import {
  getInitialContext,
  saveExchangeContext,
  loadStoredExchangeContext,
} from "@/lib/context/ExchangeHelpers";
import { ErrorMessage, ExchangeContext } from "@/lib/structure/types";
import { usePriceAPI } from "../0X/fetcher";

// ✅ Define Context Type
type ExchangeContextType = {
  exchangeContext: ExchangeContext;
  setExchangeContext: (context: ExchangeContext) => void;
  sellAmount: bigint;
  setSellAmount: (amount: bigint) => void;
  buyAmount: bigint;
  setBuyAmount: (amount: bigint) => void;
  isLoadingPrice: boolean;
  priceData: any; // Adjust this type if needed
  PriceError: ErrorMessage | null;
};

// ✅ Create Context
const ExchangeContextState = createContext<ExchangeContextType | null>(null);

// ✅ Provider Component
export function ExchangeWrapper({ children }: { children: React.ReactNode }) {
  const chainId = useChainId(); // ✅ Hook is at the top level

  // ✅ Start with stored context, but ensure it's non-null when rendering
  const [exchangeContext, setExchangeContext] = useState<ExchangeContext>(
    loadStoredExchangeContext() || getInitialContext(chainId || 1) // Default to chainId 1 if unavailable
  );
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

  return (
    <ExchangeContextState.Provider
      value={{
        exchangeContext,
        setExchangeContext,
        sellAmount,
        setSellAmount,
        buyAmount,
        setBuyAmount,
        isLoadingPrice: false, // Placeholder, update this if needed
        priceData: null, // Placeholder, update this if needed
        PriceError: null, // Placeholder, update this if needed
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

export const useTradeData = () => {
  const { exchangeContext } = useExchangeContext();
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

type PriceAPIFetchProps = {
  setErrorMessage: (message?: ErrorMessage) => void;
  apiErrorCallBack: (error: ErrorMessage) => void;
};

// ✅ Hook to wrap usePriceAPI and return the same elements
export const usePriceAPIFetch = ({ setErrorMessage, apiErrorCallBack }: PriceAPIFetchProps) => {
  const { isLoading: isLoadingPrice, data: priceData, error: PriceError } = usePriceAPI({
    setErrorMessage,
    apiErrorCallBack
  });

  return { isLoadingPrice, priceData, PriceError };
};
