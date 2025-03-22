// File: ExchangeContext.tsx (Corrected for Nested Amounts in TokenContracts)
"use client";

import React, { createContext, useEffect, useState, ReactNode } from "react";
import { useChainId } from "wagmi";
import {
  getInitialContext,
  saveExchangeContext,
  loadStoredExchangeContext,
} from "@/lib/context/ExchangeHelpers";
import {
  ExchangeContext,
  TRADE_DIRECTION,
  TokenContract,
  ErrorMessage,
  STATUS,
} from "@/lib/structure/types";

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

export const ExchangeContextState = createContext<ExchangeContextType | null>(null);

export function ExchangeWrapper({ children }: { children: ReactNode }) {
  const chainId = useChainId();
  const [exchangeContext, setExchangeContext] = useState<ExchangeContext | null>(null);
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | undefined>(undefined);
  const [apiErrorMessage, setApiErrorMessage] = useState<ErrorMessage | undefined>(undefined);

  const setSellAmount = (amount: bigint) => {
    setExchangeContext((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tradeData: {
          ...prev.tradeData,
          sellTokenContract: prev.tradeData.sellTokenContract
            ? {
                ...prev.tradeData.sellTokenContract,
                amount,
              }
            : undefined,
        },
      };
    });
  };

  const setBuyAmount = (amount: bigint) => {
    setExchangeContext((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tradeData: {
          ...prev.tradeData,
          buyTokenContract: prev.tradeData.buyTokenContract
            ? {
                ...prev.tradeData.buyTokenContract,
                amount,
              }
            : undefined,
        },
      };
    });
  };

  const setTradeDirection = (type: TRADE_DIRECTION) => {
    setExchangeContext((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tradeData: {
          ...prev.tradeData,
          transactionType: type,
        },
      };
    });
  };

  const setSlippageBps = (bps: number) => {
    setExchangeContext((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tradeData: {
          ...prev.tradeData,
          slippageBps: bps,
        },
      };
    });
  };

  const setSellTokenContract = (contract: TokenContract | undefined) => {
    setExchangeContext((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tradeData: {
          ...prev.tradeData,
          sellTokenContract: contract,
        },
      };
    });
  };

  const setBuyTokenContract = (contract: TokenContract | undefined) => {
    setExchangeContext((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tradeData: {
          ...prev.tradeData,
          buyTokenContract: contract,
        },
      };
    });
  };

  useEffect(() => {
    if (chainId) {
      const storedContext = loadStoredExchangeContext();
      const initialContext = storedContext || getInitialContext(chainId);
      setExchangeContext(initialContext);
    }
  }, [chainId]);

  if (!exchangeContext) return null;

  return (
    <ExchangeContextState.Provider
      value={{
        exchangeContext,
        setExchangeContext,
        sellAmount: exchangeContext.tradeData.sellTokenContract?.amount ?? BigInt(0),
        setSellAmount,
        buyAmount: exchangeContext.tradeData.buyTokenContract?.amount ?? BigInt(0),
        setBuyAmount,
        transactionType: exchangeContext.tradeData.transactionType ?? TRADE_DIRECTION.BUY_EXACT_IN,
        setTradeDirection,
        slippageBps: exchangeContext.tradeData.slippageBps ?? 0,
        setSlippageBps,
        sellTokenContract: exchangeContext.tradeData.sellTokenContract,
        setSellTokenContract,
        buyTokenContract: exchangeContext.tradeData.buyTokenContract,
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
