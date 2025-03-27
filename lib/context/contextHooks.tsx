"use client";

import { useContext, useMemo } from "react";
import { ExchangeContextState } from "@/lib/context/ExchangeContext";
import {
  TokenContract,
  TRADE_DIRECTION,
  ErrorMessage,
  STATUS,
  TradeData,
  API_TRADING_PROVIDER,
} from "@/lib/structure/types";

export const useExchangeContext = () => {
  const context = useContext(ExchangeContextState);
  if (!context) {
    throw new Error("useExchangeContext must be used within an ExchangeWrapper.");
  }
  return context;
};

export const useSellAmount = (): [bigint, (amount: bigint) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const sellAmount = exchangeContext.tradeData.sellTokenContract?.amount ?? 0n;

  const setSellAmount = (amount: bigint) => {
    const token = exchangeContext.tradeData.sellTokenContract;
    if (!token) {
      console.warn("Cannot set sellAmount — sellTokenContract is undefined.");
      return;
    }
    setExchangeContext((prev) => ({
      ...prev,
      tradeData: {
        ...prev.tradeData,
        sellTokenContract: { ...token, amount },
      },
    }));
  };

  return [sellAmount, setSellAmount];
};

export const useSellBalance = (): [bigint, (balance: bigint) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const sellBalance = exchangeContext.tradeData.sellTokenContract?.balance ?? 0n;

  const setSellBalance = (balance: bigint) => {
    const token = exchangeContext.tradeData.sellTokenContract;
    if (!token) {
      console.warn("Cannot set sellBalance — sellTokenContract is undefined.");
      return;
    }
    setExchangeContext((prev) => ({
      ...prev,
      tradeData: {
        ...prev.tradeData,
        sellTokenContract: { ...token, balance },
      },
    }));
  };

  return [sellBalance, setSellBalance];
};

export const useBuyAmount = (): [bigint, (amount: bigint) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const buyAmount = exchangeContext.tradeData.buyTokenContract?.amount ?? 0n;

  const setBuyAmount = (amount: bigint) => {
    const token = exchangeContext.tradeData.buyTokenContract;
    if (!token) {
      console.warn("Cannot set buyAmount — buyTokenContract is undefined.");
      return;
    }
    setExchangeContext((prev) => ({
      ...prev,
      tradeData: {
        ...prev.tradeData,
        buyTokenContract: { ...token, amount },
      },
    }));
  };

  return [buyAmount, setBuyAmount];
};

export const useBuyBalance = (): [bigint, (balance: bigint) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const buyBalance = exchangeContext.tradeData.buyTokenContract?.balance ?? 0n;

  const setBuyBalance = (balance: bigint) => {
    const token = exchangeContext.tradeData.buyTokenContract;
    if (!token) {
      console.warn("Cannot set buyBalance — buyTokenContract is undefined.");
      return;
    }
    setExchangeContext((prev) => ({
      ...prev,
      tradeData: {
        ...prev.tradeData,
        buyTokenContract: { ...token, balance },
      },
    }));
  };

  return [buyBalance, setBuyBalance];
};

export const useSellTokenContract = (): [TokenContract | undefined, (contract: TokenContract | undefined) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  return [
    exchangeContext.tradeData.sellTokenContract,
    (contract) =>
      setExchangeContext((prev) => ({
        ...prev,
        tradeData: {
          ...prev.tradeData,
          sellTokenContract: contract,
        },
      })),
  ];
};

export const useBuyTokenContract = (): [TokenContract | undefined, (contract: TokenContract | undefined) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  return [
    exchangeContext.tradeData.buyTokenContract,
    (contract) =>
      setExchangeContext((prev) => ({
        ...prev,
        tradeData: {
          ...prev.tradeData,
          buyTokenContract: contract,
        },
      })),
  ];
};

export const useSlippageBps = (): [number, (bps: number) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  return [
    exchangeContext.tradeData.slippageBps,
    (bps) =>
      setExchangeContext((prev) => ({
        ...prev,
        tradeData: {
          ...prev.tradeData,
          slippageBps: bps,
        },
      })),
  ];
};

export const useTradeDirection = (): [TRADE_DIRECTION, (type: TRADE_DIRECTION) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  return [
    exchangeContext.tradeData.transactionType,
    (type) =>
      setExchangeContext((prev) => ({
        ...prev,
        tradeData: {
          ...prev.tradeData,
          transactionType: type,
        },
      })),
  ];
};

export const useTradeData = (): TradeData => {
  const { exchangeContext } = useExchangeContext();
  return useMemo(() => exchangeContext.tradeData, [exchangeContext.tradeData]);
};

export const useErrorMessage = (): [ErrorMessage | undefined, (error: ErrorMessage | undefined) => void] => {
  const { errorMessage, setErrorMessage } = useExchangeContext();
  return [errorMessage, setErrorMessage];
};

export const useApiErrorMessage = (): [ErrorMessage | undefined, (error: ErrorMessage | undefined) => void] => {
  const { apiErrorMessage, setApiErrorMessage } = useExchangeContext();
  return [apiErrorMessage, setApiErrorMessage];
};

export const useApiProvider = (): API_TRADING_PROVIDER | undefined => {
  const { exchangeContext } = useExchangeContext();
  return exchangeContext.apiTradingProvider;
};

export const AllHooksExample = () => {
  const { exchangeContext } = useExchangeContext();

  const [sellAmount, setSellAmount] = useSellAmount();
  const [sellBalance, setSellBalance] = useSellBalance();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [buyBalance, setBuyBalance] = useBuyBalance();
  const [sellTokenContract, setSellTokenContract] = useSellTokenContract();
  const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();
  const [transactionType, setTradeDirection] = useTradeDirection();
  const [slippageBps, setSlippageBps] = useSlippageBps();
  const [errorMessage, setErrorMessage] = useErrorMessage();
  const [apiErrorMessage, setApiErrorMessage] = useApiErrorMessage();
  const apiProvider = useApiProvider();
  const tradeData = useTradeData();

  return (
    <div style={{ fontFamily: "monospace", padding: "1rem" }}>
      <h2>🧪 Hook Test Output</h2>
      <div>Sell Amount: {sellAmount.toString()}</div>
      <div>Sell Balance: {sellBalance.toString()}</div>
      <div>Buy Amount: {buyAmount.toString()}</div>
      <div>Buy Balance: {buyBalance.toString()}</div>
      <div>Slippage Bps: {slippageBps}</div>
      <div>Transaction Type: {transactionType}</div>
      <div>API Provider: {apiProvider}</div>
      <div>Sell Token: {sellTokenContract?.symbol ?? "None"}</div>
      <div>Buy Token: {buyTokenContract?.symbol ?? "None"}</div>
      <div>Trade Data: {JSON.stringify(tradeData, null, 2)}</div>
      <div>Exchange Context: {JSON.stringify(exchangeContext, null, 2)}</div>
      <div>Error Message: {JSON.stringify(errorMessage)}</div>
      <div>API Error Message: {JSON.stringify(apiErrorMessage)}</div>

      <hr />

      <button onClick={() => setSellAmount(sellAmount + 1n)}>+1 Sell</button>
      <button onClick={() => setSellBalance(sellBalance + 1000000000000000000n)}>+1 ETH Balance</button>
      <button onClick={() => setBuyAmount(buyAmount + 1n)}>+1 Buy</button>
      <button onClick={() => setBuyBalance(buyBalance + 2000000000000000000n)}>+2 DAI Balance</button>

      <button onClick={() =>
        setSellTokenContract({
          address: "0x111",
          symbol: "ETH",
          name: "Ethereum",
          decimals: 18,
          balance: 1000000000000000000n,
          amount: sellAmount,
          totalSupply: 100000000000000000000n,
          chainId: 1,
        })
      }>
        Set Sell Token (ETH)
      </button>

      <button onClick={() =>
        setBuyTokenContract({
          address: "0x222",
          symbol: "DAI",
          name: "Dai",
          decimals: 18,
          balance: 5000000000000000000n,
          amount: buyAmount,
          totalSupply: 100000000000000000000n,
          chainId: 1,
        })
      }>
        Set Buy Token (DAI)
      </button>

      <button onClick={() => setTradeDirection(TRADE_DIRECTION.BUY_EXACT_IN)}>
        Set Direction: BUY_EXACT_IN
      </button>

      <button onClick={() => setSlippageBps(slippageBps + 10)}>
        Increase Slippage
      </button>

      <button onClick={() => setErrorMessage({
        errCode: 1, msg: "Something broke", source: "test", status: STATUS.FAILED
      })}>
        Trigger Error
      </button>

      <button onClick={() => setApiErrorMessage({
        errCode: 2, msg: "API failed", source: "fetch", status: STATUS.FAILED
      })}>
        Trigger API Error
      </button>

      <button onClick={() => {
        setErrorMessage(undefined);
        setApiErrorMessage(undefined);
      }}>
        Clear Errors
      </button>
    </div>
  );
};
