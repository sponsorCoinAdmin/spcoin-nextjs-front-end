// File: ExchangeContext.tsx
"use client";

import React, { createContext, useEffect, useState, ReactNode } from "react";
import { useChainId } from "wagmi";

import {
  ExchangeContext as ExchangeContextTypeOnly,
  TRADE_DIRECTION,
  TokenContract,
  ErrorMessage,
} from "@/lib/structure/types";

import {
  getInitialContext,
  loadStoredExchangeContext,
  sanitizeExchangeContext,
} from "@/lib/context/ExchangeHelpers";

// Full context shape for use in the provider
export type ExchangeContextType = {
  exchangeContext: ExchangeContextTypeOnly;
  setExchangeContext: (updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly) => void;

  setSellAmount: (amount: bigint) => void;
  setBuyAmount: (amount: bigint) => void;
  setSellTokenContract: (contract: TokenContract | undefined) => void;
  setBuyTokenContract: (contract: TokenContract | undefined) => void;
  setTradeDirection: (type: TRADE_DIRECTION) => void;
  setSlippageBps: (bps: number) => void;

  errorMessage: ErrorMessage | undefined;
  setErrorMessage: (error: ErrorMessage | undefined) => void;
  apiErrorMessage: ErrorMessage | undefined;
  setApiErrorMessage: (error: ErrorMessage | undefined) => void;
};

// Create the context
export const ExchangeContextState = createContext<ExchangeContextType | null>(null);

// Main provider
export function ExchangeWrapper({ children }: { children: ReactNode }) {
  const chainId = useChainId();
  const [exchangeContext, setExchangeContextInternal] = useState<ExchangeContextTypeOnly | null>(null);
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | undefined>();
  const [apiErrorMessage, setApiErrorMessage] = useState<ErrorMessage | undefined>();

  // ✅ Wrapper setter to mutate context safely
  const setExchangeContext = (updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly) => {
    setExchangeContextInternal((prev) => (prev ? updater(prev) : prev));
  };

  // ✅ Individual field setters
  const setSellAmount = (amount: bigint) => {
    setExchangeContext((prev) => {
      const token = prev.tradeData.sellTokenContract;
      return {
        ...prev,
        tradeData: {
          ...prev.tradeData,
          sellTokenContract: token ? { ...token, amount } : undefined,
        },
      };
    });
  };

  const setBuyAmount = (amount: bigint) => {
    setExchangeContext((prev) => {
      const token = prev.tradeData.buyTokenContract;
      return {
        ...prev,
        tradeData: {
          ...prev.tradeData,
          buyTokenContract: token ? { ...token, amount } : undefined,
        },
      };
    });
  };

  const setSellTokenContract = (contract: TokenContract | undefined) => {
    setExchangeContext((prev) => ({
      ...prev,
      tradeData: {
        ...prev.tradeData,
        sellTokenContract: contract,
      },
    }));
  };

  const setBuyTokenContract = (contract: TokenContract | undefined) => {
    setExchangeContext((prev) => ({
      ...prev,
      tradeData: {
        ...prev.tradeData,
        buyTokenContract: contract,
      },
    }));
  };

  const setTradeDirection = (type: TRADE_DIRECTION) => {
    setExchangeContext((prev) => ({
      ...prev,
      tradeData: {
        ...prev.tradeData,
        transactionType: type,
      },
    }));
  };

  const setSlippageBps = (bps: number) => {
    setExchangeContext((prev) => ({
      ...prev,
      tradeData: {
        ...prev.tradeData,
        slippageBps: bps,
      },
    }));
  };

  // ✅ Initialize once chainId is available
  useEffect(() => {
    if (chainId && !exchangeContext) {
      const stored = loadStoredExchangeContext();
      const initial = getInitialContext(chainId);
      const sanitized = sanitizeExchangeContext(stored, chainId);
      setExchangeContextInternal({ ...initial, ...sanitized });
    }
  }, [chainId, exchangeContext]);

  // Block rendering until initialized
  if (!exchangeContext) return null;

  return (
    <ExchangeContextState.Provider
      value={{
        exchangeContext,
        setExchangeContext,

        setSellAmount,
        setBuyAmount,
        setSellTokenContract,
        setBuyTokenContract,
        setTradeDirection,
        setSlippageBps,

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
