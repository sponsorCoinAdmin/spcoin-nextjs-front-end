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
  setIsLoadingPrice: (loading: boolean) => void;
  priceData: any;
  setPriceData: (priceData: any) => void;
  priceError: ErrorMessage | null;
  setPriceError: (priceError: ErrorMessage | null) => void;
};

// ✅ Create Context
const ExchangeContextState = createContext<ExchangeContextType | null>(null);

// ✅ Provider Component
export function ExchangeWrapper({ children }: { children: React.ReactNode }) {
  const chainId = useChainId();

  const [exchangeContext, setExchangeContext] = useState<ExchangeContext>(
    loadStoredExchangeContext() || getInitialContext(chainId || 1)
  );
  const [sellAmount, setSellAmount] = useState<bigint>(BigInt(0));
  const [buyAmount, setBuyAmount] = useState<bigint>(BigInt(0));
  const [isLoadingPrice, setIsLoadingPrice] = useState<boolean>(false);
  const [priceData, setPriceData] = useState<any>(null);
  const [priceError, setPriceError] = useState<ErrorMessage | null>(null);

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
        isLoadingPrice,
        setIsLoadingPrice,
        priceData,
        setPriceData,
        priceError,
        setPriceError,
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

export const useSellAmount = () => {
  const context = useExchangeContext();
  return [context.sellAmount, context.setSellAmount] as const;
};

export const useBuyAmount = () => {
  const context = useExchangeContext();
  return [context.buyAmount, context.setBuyAmount] as const;
};

export const useIsLoadingPrice = () => {
  const context = useExchangeContext();
  return [context.isLoadingPrice, context.setIsLoadingPrice] as const;
};

export const usePriceData = () => {
  const context = useExchangeContext();
  return [context.priceData, context.setPriceData] as const;
};

export const usePriceError = () => {
  const context = useExchangeContext();
  return [context.priceError, context.setPriceError] as const;
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
