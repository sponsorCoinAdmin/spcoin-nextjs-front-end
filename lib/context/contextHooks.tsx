// File: contextHooks.tsx
"use client";

import { useContext, useMemo } from "react";
import { ExchangeContextState } from "@/lib/context/ExchangeContext";
import {
  TokenContract,
  TRADE_DIRECTION,
  ErrorMessage,
  STATUS,
  TradeData,
} from "@/lib/structure/types";

// ✅ Hook to use Exchange Context
export const useExchangeContext = () => {
  const context = useContext(ExchangeContextState);
  if (!context) {
    throw new Error("useExchangeContext must be used within an ExchangeWrapper.");
  }
  return context;
};

// ✅ Hook to derive tradeData (single source of truth)
export const useTradeData = (): TradeData => {
  const context = useExchangeContext();
  return useMemo(
    () => ({
      transactionType: context.transactionType,
      buyTokenContract: context.buyTokenContract,
      sellTokenContract: context.sellTokenContract,
      buyAmount: context.buyAmount,
      sellAmount: context.sellAmount,
      slippageBps: context.slippageBps,
    }),
    [
      context.transactionType,
      context.buyTokenContract,
      context.sellTokenContract,
      context.buyAmount,
      context.sellAmount,
      context.slippageBps,
    ]
  );
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

export const useTradeDirection = () => {
  const context = useExchangeContext();
  return [context.transactionType, context.setTradeDirection] as [TRADE_DIRECTION, (type: TRADE_DIRECTION) => void];
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

export const useErrorMessage = () => {
  const context = useExchangeContext();
  return [context.errorMessage, context.setErrorMessage] as [ErrorMessage | undefined, (error: ErrorMessage | undefined) => void];
};

export const useApiErrorMessage = () => {
  const context = useExchangeContext();
  return [context.apiErrorMessage, context.setApiErrorMessage] as [ErrorMessage | undefined, (error: ErrorMessage | undefined) => void];
};

// ✅ Example usage component for all hooks
export const AllHookExample = () => {
  const { exchangeContext } = useExchangeContext();
  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [transactionType, setTradeDirection] = useTradeDirection();
  const [slippageBps, setSlippageBps] = useSlippageBps();
  const [sellTokenContract, setSellTokenContract] = useSellTokenContract();
  const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();
  const [errorMessage, setErrorMessage] = useErrorMessage();
  const [apiErrorMessage, setApiErrorMessage] = useApiErrorMessage();
  const tradeData = useTradeData();

  return (
    <div>
      <h2>Sell Amount: {sellAmount.toString()}</h2>
      <h2>Buy Amount: {buyAmount.toString()}</h2>
      <h2>Transaction Type: {transactionType}</h2>
      <h2>Slippage Bps: {slippageBps}</h2>
      <h2>Sell Token: {sellTokenContract?.symbol ?? "None"}</h2>
      <h2>Buy Token: {buyTokenContract?.symbol ?? "None"}</h2>
      <h2>Trade Data: {JSON.stringify(tradeData, null, 2)}</h2>
      <h2>Exchange Context: {JSON.stringify(exchangeContext, null, 2)}</h2>
      <h2>Error: {JSON.stringify(errorMessage)}</h2>
      <h2>API Error: {JSON.stringify(apiErrorMessage)}</h2>

      <button onClick={() => setSellAmount(sellAmount + BigInt(1))}>+1 Sell Amount</button>
      <button onClick={() => setBuyAmount(buyAmount + BigInt(1))}>+1 Buy Amount</button>
      <button onClick={() => setTradeDirection(TRADE_DIRECTION.SELL_EXACT_OUT)}>
        Set SELL_EXACT_OUT
      </button>
      <button onClick={() => setSlippageBps(slippageBps + 10)}>Increase Slippage</button>
      <button onClick={() => setSellTokenContract({
        address: "0x123",
        amount: BigInt(1000),
        balance: BigInt(5000),
        symbol: "ETH",
        name: "Ethereum",
        totalSupply: BigInt(1000000),
      })}>
        Set Sell Token
      </button>
      <button onClick={() => setBuyTokenContract({
        address: "0x456",
        amount: BigInt(2000),
        balance: BigInt(8000),
        symbol: "DAI",
        name: "Dai Stablecoin",
        totalSupply: BigInt(5000000),
      })}>
        Set Buy Token
      </button>
      <button onClick={() => setErrorMessage({ errCode: 100, msg: "Error occurred", source: "hook", status: STATUS.FAILED })}>
        Trigger Error
      </button>
      <button onClick={() => setApiErrorMessage({ errCode: 200, msg: "API failed", source: "hook", status: STATUS.FAILED })}>
        Trigger API Error
      </button>
      <button onClick={() => { setErrorMessage(undefined); setApiErrorMessage(undefined); }}>
        Clear Errors
      </button>
    </div>
  );
};
