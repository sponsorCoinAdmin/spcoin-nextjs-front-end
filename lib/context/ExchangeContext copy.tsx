// File: ExchangeContext.tsx
"use client";

import React, { createContext, useEffect, useState, ReactNode } from "react";
import { useChainId } from "wagmi";
import {
  getInitialContext,
  saveExchangeContext,
  loadStoredExchangeContext,
} from "@/lib/context/ExchangeHelpers";
import { ExchangeContext, TRADE_DIRECTION, TokenContract, ErrorMessage, STATUS } from "@/lib/structure/types";

// Define Context Type
export type ExchangeContextType = {
  exchangeContext: ExchangeContext;
  setExchangeContext: (context: ExchangeContext) => void;
  sellAmount: bigint;
  setSellAmount: (amount: bigint) => void;
  buyAmount: bigint;
  setBuyAmount: (amount: bigint) => void;
  transactionType: TRADE_DIRECTION;
  setTradeDirection: (type: TRADE_DIRECTION) => void;
  slippageBps: number;
  setSlippageBps: (bps: number) => void;
  sellTokenContract: TokenContract | undefined;
  setSellTokenContract: (contract: TokenContract | undefined) => void;
  buyTokenContract: TokenContract | undefined;
  setBuyTokenContract: (contract: TokenContract | undefined) => void;
  errorMessage: ErrorMessage | undefined;
  setErrorMessage: (error: ErrorMessage | undefined) => void;
  apiErrorMessage: ErrorMessage | undefined;
  setApiErrorMessage: (error: ErrorMessage | undefined) => void;
};

// Export ExchangeContextState
export const ExchangeContextState = createContext<ExchangeContextType | null>(null);

// Provider Component
export function ExchangeWrapper({ children }: { children: ReactNode }) {
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
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | undefined>(undefined);
  const [apiErrorMessage, setApiErrorMessage] = useState<ErrorMessage | undefined>(undefined);

  // Custom function to update `transactionType` and `exchangeContext`
  const setTradeDirection = (type: TRADE_DIRECTION) => {
    setTransactionTypeState(type);

    setExchangeContext((prevContext) => {
      if (!prevContext) return prevContext;

      return {
        ...prevContext,
        tradeData: {
          ...prevContext.tradeData,
          transactionType: type, // Update tradeData.transactionType
        },
      };
    });
  };

  // Load initial context once `chainId` is available
  useEffect(() => {
    if (chainId) {
      console.log("🔍 Initializing ExchangeContext with chainId:", chainId);
      const storedContext = loadStoredExchangeContext();
      const initialContext = storedContext || getInitialContext(chainId);
      setExchangeContext(initialContext);
    }
  }, [chainId]);

  // Sync state with tradeData
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
    return null;
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
        setTradeDirection,
        slippageBps,
        setSlippageBps,
        sellTokenContract,
        setSellTokenContract,
        buyTokenContract,
        setBuyTokenContract,
        errorMessage,
        setErrorMessage,
        apiErrorMessage,
        setApiErrorMessage,
      }}
    >
      {children}
    </ExchangeContextState.Provider>
  );
}
