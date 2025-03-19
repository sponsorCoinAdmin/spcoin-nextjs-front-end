"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useChainId } from "wagmi";
import {
  getInitialContext,
  saveExchangeContext,
  loadStoredExchangeContext,
} from "@/lib/context/ExchangeHelpers";
import { ExchangeContext, TRANS_DIRECTION } from "@/lib/structure/types";

// ✅ Define Context Type
type ExchangeContextType = {
  exchangeContext: ExchangeContext;
  setExchangeContext: (context: ExchangeContext) => void;
  sellAmount: bigint;
  setSellAmount: (amount: bigint) => void;
  buyAmount: bigint;
  setBuyAmount: (amount: bigint) => void;
  transactionType: TRANS_DIRECTION;
  setTransDirection: (type: TRANS_DIRECTION) => void;
  slippageBps: number;
  setSlippageBps: (bps: number) => void;
};

// ✅ Create Context
const ExchangeContextState = createContext<ExchangeContextType | null>(null);

// ✅ Provider Component
export function ExchangeWrapper({ children }: { children: React.ReactNode }) {
  const chainId = useChainId();
  const [exchangeContext, setExchangeContext] = useState<ExchangeContext | null>(null);
  const [sellAmount, setSellAmount] = useState<bigint>(BigInt(0));
  const [buyAmount, setBuyAmount] = useState<bigint>(BigInt(0));
  const [transactionType, setTransDirection] = useState<TRANS_DIRECTION>(
    exchangeContext?.tradeData?.transactionType ?? TRANS_DIRECTION.BUY_EXACT_IN
  );
  const [slippageBps, setSlippageBps] = useState<number>(exchangeContext?.tradeData?.slippageBps ?? 0);

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
      setTransDirection(exchangeContext.tradeData.transactionType ?? TRANS_DIRECTION.BUY_EXACT_IN);
      setSlippageBps(exchangeContext.tradeData.slippageBps ?? 0);
    }
  }, [exchangeContext]);

  if (!exchangeContext) {
    return null; // Render nothing until `exchangeContext` is ready
  }

  return (
    <ExchangeContextState.Provider
      value={{ exchangeContext, setExchangeContext, sellAmount, setSellAmount, buyAmount, setBuyAmount, transactionType, setTransDirection, slippageBps, setSlippageBps }}
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

// ✅ Custom hooks for using sellAmount, buyAmount, transactionType, and slippageBps with setters
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
  return [context.transactionType, context.setTransDirection] as [TRANS_DIRECTION, (type: TRANS_DIRECTION) => void];
};

export const useSlippageBps = () => {
  const context = useExchangeContext();
  return [context.slippageBps, context.setSlippageBps] as [number, (bps: number) => void];
};

// ✅ Example usage component
export const PriceDisplay = () => {
  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [transactionType, setTransDirection] = useTransactionType();
  const [slippageBps, setSlippageBps] = useSlippageBps();

  return (
    <div>
      <h2>Sell Amount: {sellAmount.toString()}</h2>
      <h2>Buy Amount: {buyAmount.toString()}</h2>
      <h2>Transaction Type: {transactionType}</h2>
      <h2>Slippage Bps: {slippageBps}</h2>
      <button onClick={() => setSellAmount(sellAmount + BigInt(1))}>Increase Sell Amount</button>
      <button onClick={() => setBuyAmount(buyAmount + BigInt(1))}>Increase Buy Amount</button>
      <button onClick={() => setTransDirection(transactionType === TRANS_DIRECTION.BUY_EXACT_IN ? TRANS_DIRECTION.SELL_EXACT_OUT : TRANS_DIRECTION.BUY_EXACT_IN)}>Toggle Transaction Type</button>
      <button onClick={() => setSlippageBps(slippageBps + 10)}>Increase Slippage</button>
    </div>
  );
};
