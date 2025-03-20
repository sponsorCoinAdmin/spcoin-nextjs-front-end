"use client";

import { useContext } from "react";
import { ExchangeContextState } from "@/lib/context/ExchangeContext";
import { TokenContract, TRADE_DIRECTION } from "@/lib/structure/types"; // ✅ Importing required types

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

// ✅ Example Usage Component (Updated `PriceDisplay` with `useExchangeContext`)
export const PriceDisplay = () => {
  const { exchangeContext } = useExchangeContext(); // ✅ Now using useExchangeContext
  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [transactionType, setTransDirection] = useTransactionType();
  const [slippageBps, setSlippageBps] = useSlippageBps();
  const [sellTokenContract, setSellTokenContract] = useSellTokenContract();
  const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();
  const tradeData = useTradeData();

  return (
    <div>
      <h2>Sell Amount: {sellAmount.toString()}</h2>
      <h2>Buy Amount: {buyAmount.toString()}</h2>
      <h2>Transaction Type: {transactionType}</h2>
      <h2>Slippage Bps: {slippageBps}</h2>
      <h2>Sell Token Contract: {sellTokenContract?.symbol ?? "None"}</h2>
      <h2>Buy Token Contract: {buyTokenContract?.symbol ?? "None"}</h2>
      <h2>Trade Data: {JSON.stringify(tradeData, null, 2)}</h2>
      <h2>Exchange Context: {JSON.stringify(exchangeContext, null, 2)}</h2> {/* ✅ Displaying full exchangeContext */}
      
      <button onClick={() => setTransDirection(TRADE_DIRECTION.SELL_EXACT_OUT)}>
        Change to SELL_EXACT_OUT
      </button>
      <button onClick={() => setTransDirection(TRADE_DIRECTION.BUY_EXACT_IN)}>
        Change to BUY_EXACT_IN
      </button>
    </div>
  );
};
