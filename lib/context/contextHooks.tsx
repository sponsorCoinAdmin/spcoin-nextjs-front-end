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
  CONTAINER_TYPE,
  SP_COIN_DISPLAY,
  ExchangeContext,
} from "@/lib/structure/types";
import { tokenContractsEqual } from '@/lib/network/utils';
import { isSpCoin } from "../spCoin/coreUtils";
import { spCoinDisplayString } from '@/lib/spCoin/guiControl';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_CONTEXT_HOOKS === 'true';
const debugLog = createDebugLogger('contextHooks', DEBUG_ENABLED, LOG_TIME);

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
    (contract) => {
      const oldContract = exchangeContext.tradeData.sellTokenContract;
      const isSame = tokenContractsEqual(oldContract, contract);

      if (isSame) return;

      setExchangeContext((prev) => ({
        ...prev,
        tradeData: {
          ...prev.tradeData,
          sellTokenContract: contract,
        },
      }));
    },
  ];
};

export const useBuyTokenContract = (): [TokenContract | undefined, (contract: TokenContract | undefined) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  return [
    exchangeContext.tradeData.buyTokenContract,
    (contract) => {
      const oldContract = exchangeContext.tradeData.buyTokenContract;
      const oldDisplay = exchangeContext.spCoinDisplay;
      const isSame = tokenContractsEqual(oldContract, contract);

      const isSp = contract && isSpCoin(contract);
      const newDisplay = isSp ? SP_COIN_DISPLAY.SHOW_ADD_SPONSOR_BUTTON : SP_COIN_DISPLAY.OFF;

      if (isSame && oldDisplay === newDisplay) return;

      setExchangeContext((prev) => ({
        ...prev,
        tradeData: {
          ...prev.tradeData,
          buyTokenContract: contract,
        },
      }));
      debugSetSpCoinDisplay(oldDisplay, newDisplay, setExchangeContext);
    },
  ];
};

// ...remaining unchanged hooks below
export const useSellTokenAddress = (): string | undefined => {
  const [sellTokenContract] = useSellTokenContract();
  return sellTokenContract?.address;
};

export const useBuyTokenAddress = (): string | undefined => {
  const [buyTokenContract] = useBuyTokenContract();
  return buyTokenContract?.address;
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

export const useSlippagePercent = (): [string, (percent: string) => void] => {
  const [slippageBps, setSlippageBps] = useSlippageBps();

  const slippagePercent = `${(slippageBps / 100)
    .toLocaleString(undefined, { maximumFractionDigits: 2 })
    .replace(/\.?0+$/, '')}%`;

  const setSlippagePercent = (percent: string) => {
    const cleaned = percent.replace('%', '').trim();
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) {
      setSlippageBps(Math.round(parsed * 100));
    }
  };

  return [slippagePercent, setSlippagePercent];
};

export const useTradeDirection = (): [TRADE_DIRECTION, (type: TRADE_DIRECTION) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  return [
    exchangeContext.tradeData.tradeDirection,
    (type) =>
      setExchangeContext((prev) => ({
        ...prev,
        tradeData: {
          ...prev.tradeData,
          tradeDirection: type,
        },
      })),
  ];
};

export const useContainerType = (initialType?: CONTAINER_TYPE): [CONTAINER_TYPE, (type: CONTAINER_TYPE) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  // Initialize containerType if undefined and initialType is provided
  if (exchangeContext.containerType === undefined && initialType !== undefined) {
    setExchangeContext((prev) => ({
      ...prev,
      containerType: initialType,
    }));
  }

  return [
    exchangeContext.containerType || CONTAINER_TYPE.SELL_SELECT_CONTAINER,
    (type) =>
      setExchangeContext((prev) => ({
        ...prev,
        containerType: type,
      })),
  ];
};

/**
 * Hook to read and update spCoinDisplay with debug output.
 */

export const useSpCoinDisplay = (): [SP_COIN_DISPLAY, (display: SP_COIN_DISPLAY) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const wrappedDebugSetter = (display: SP_COIN_DISPLAY) =>
    debugSetSpCoinDisplay(exchangeContext.spCoinDisplay, display, setExchangeContext);

  return [exchangeContext.spCoinDisplay, wrappedDebugSetter];
};

// Archived: useSyncSpCoinDisplay is currently unused and has been disabled.
// This file is retained for future reference or reuse.

/**
 * Centralized debug-aware setter for spCoinDisplay.
 */
export const debugSetSpCoinDisplay = (
  oldDisplay: SP_COIN_DISPLAY,
  newDisplay: SP_COIN_DISPLAY,
  setExchangeContext: (updater: (prev: any) => any) => void
) => {
  if (oldDisplay !== newDisplay) {
    debugLog.log(
      `🔁 spCoinDisplay change: ${spCoinDisplayString(oldDisplay)} → ${spCoinDisplayString(newDisplay)}`
    );
  } else {
    debugLog.log(`⚠️ spCoinDisplay unchanged: ${spCoinDisplayString(oldDisplay)}`);
  }

  setExchangeContext((prev) => ({
    ...prev,
    spCoinDisplay: newDisplay,
  }));
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
  const [tradeDirection, setTradeDirection] = useTradeDirection();
  const [slippageBps, setSlippageBps] = useSlippageBps();
  const [containerType, setContainerType] = useContainerType();
  const [errorMessage, setErrorMessage] = useErrorMessage();
  const [apiErrorMessage, setApiErrorMessage] = useApiErrorMessage();
  const [spCoinDisplay, setSpCoinDisplay] = useSpCoinDisplay();
  const apiProvider = useApiProvider();
  const tradeData = useTradeData();
  const sellTokenAddress = useSellTokenAddress();
  const buyTokenAddress = useBuyTokenAddress();

  return (
    <div style={{ fontFamily: "monospace", padding: "1rem" }}>
      <h2>🧪 Hook Test Output</h2>
      <div>Sell Amount: {sellAmount.toString()}</div>
      <div>Sell Balance: {sellBalance.toString()}</div>
      <div>Buy Amount: {buyAmount.toString()}</div>
      <div>Buy Balance: {buyBalance.toString()}</div>
      <div>Slippage Bps: {slippageBps}</div>
      <div>Transaction Type: {tradeDirection}</div>
      <div>Container Type: {containerType}</div>
      <div>spCoinDisplay: {spCoinDisplay}</div>
      <div>API Provider: {apiProvider}</div>
      <div>Sell Token: {sellTokenContract?.symbol ?? "None"}</div>
      <div>Buy Token: {buyTokenContract?.symbol ?? "None"}</div>
      <div>Sell Token Address: {sellTokenAddress ?? "None"}</div>
      <div>Buy Token Address: {buyTokenAddress ?? "None"}</div>
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

      <button onClick={() => setContainerType(CONTAINER_TYPE.SELL_SELECT_CONTAINER)}>
        Set Container Type: SELL_SELECT_CONTAINER
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
