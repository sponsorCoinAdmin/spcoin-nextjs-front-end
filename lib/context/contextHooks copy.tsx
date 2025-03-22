// ✅ contextHooks.tsx – Full Version with Example Usage (Option 2)
"use client";

import { useContext, useMemo } from "react";
import { ExchangeContextState } from "@/lib/context/ExchangeContext";
import { TokenContract, TRADE_DIRECTION, ErrorMessage, STATUS, TradeData } from "@/lib/structure/types";

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
  return useMemo(() => ({
    transactionType: context.transactionType,
    buyTokenContract: context.buyTokenContract,
    sellTokenContract: context.sellTokenContract,
    buyAmount: context.buyAmount,
    sellAmount: context.sellAmount,
    slippageBps: context.slippageBps,
  }), [
    context.transactionType,
    context.buyTokenContract,
    context.sellTokenContract,
    context.buyAmount,
    context.sellAmount,
    context.slippageBps
  ]);
};

// ✅ Individual value hooks
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

// ✅ Example usage component – shows how to use all hooks
export const PriceDisplay = () => {
  const { exchangeContext } = useExchangeContext();
  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [transactionType, setTradeDirection] = useTradeDirection();
  const [slippageBps, setSlippageBps] = useSlippageBps();
  const [sellTokenContract, setSellTokenContract] = useSellTokenContract();
  const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();
  const tradeData = useTradeData();
  const [apiErrorMessage, setApiErrorMessage] = useApiErrorMessage();
  const [errorMessage, setErrorMessage] = useErrorMessage();

  return (
    <div>
      <h2>Sell Amount: {sellAmount.toString()}</h2>
      <h2>Buy Amount: {buyAmount.toString()}</h2>
      <h2>Transaction Type: {transactionType}</h2>
      <h2>Slippage Bps: {slippageBps}</h2>
      <h2>Sell Token Contract: {sellTokenContract?.symbol ?? "None"}</h2>
      <h2>Buy Token Contract: {buyTokenContract?.symbol ?? "None"}</h2>

      <h2>Derived Trade Data:</h2>
      <pre>{JSON.stringify(tradeData, null, 2)}</pre>

      <h2>Exchange Context:</h2>
      <pre>{JSON.stringify(exchangeContext, null, 2)}</pre>

      <h2>API Error: {JSON.stringify(apiErrorMessage, null, 2)}</h2>
      <h2>General Error: {JSON.stringify(errorMessage, null, 2)}</h2>

      <button onClick={() => setTradeDirection(TRADE_DIRECTION.SELL_EXACT_OUT)}>
        Set SELL_EXACT_OUT
      </button>
      <button onClick={() => setTradeDirection(TRADE_DIRECTION.BUY_EXACT_IN)}>
        Set BUY_EXACT_IN
      </button>
      <button
        onClick={() =>
          setApiErrorMessage({ errCode: 123, msg: "API Error!", source: "button", status: STATUS.FAILED })
        }
      >
        Trigger API Error
      </button>
      <button
        onClick={() =>
          setErrorMessage({ errCode: 456, msg: "General Error", source: "button", status: STATUS.FAILED })
        }
      >
        Trigger General Error
      </button>
      <button onClick={() => { setApiErrorMessage(undefined); setErrorMessage(undefined); }}>
        Clear Errors
      </button>
    </div>
  );
};
