// File: ExchangeContext.tsx (Single Source of Truth for TokenContract)
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
  const [sellAmount, setSellAmount] = useState<bigint>(BigInt(0));
  const [buyAmount, setBuyAmount] = useState<bigint>(BigInt(0));
  const [transactionType, setTransactionTypeState] = useState<TRADE_DIRECTION>(
    exchangeContext?.tradeData?.transactionType ?? TRADE_DIRECTION.BUY_EXACT_IN
  );
  const [slippageBps, setSlippageBps] = useState<number>(exchangeContext?.tradeData?.slippageBps ?? 0);
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | undefined>(undefined);
  const [apiErrorMessage, setApiErrorMessage] = useState<ErrorMessage | undefined>(undefined);

  const setTradeDirection = (type: TRADE_DIRECTION) => {
    setTransactionTypeState(type);
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

  useEffect(() => {
    if (exchangeContext?.tradeData) {
      setSellAmount(exchangeContext.tradeData.sellTokenContract?.amount ?? BigInt(0));
      setBuyAmount(exchangeContext.tradeData.buyTokenContract?.amount ?? BigInt(0));
      setTransactionTypeState(exchangeContext.tradeData.transactionType ?? TRADE_DIRECTION.BUY_EXACT_IN);
      setSlippageBps(exchangeContext.tradeData.slippageBps ?? 0);
    }
  }, [exchangeContext]);

  if (!exchangeContext) return null;

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
