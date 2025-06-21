'use client';

import React, { createContext, useEffect, useRef, useState } from 'react';
import { useChainId, useAccount } from 'wagmi';
import { saveLocalExchangeContext } from '@/lib/context/helpers/ExchangeSaveHelpers';
import { loadLocalExchangeContext } from '@/lib/context/helpers/ExchangeLoadHelpers';
import { sanitizeExchangeContext } from '@/lib/context/helpers/ExchangeSanitizeHelpers';
import { initExchangeContext } from '@/lib/context/helpers/initExchangeContext';

import {
  ExchangeContext as ExchangeContextTypeOnly,
  TRADE_DIRECTION,
  TokenContract,
  ErrorMessage,
  WalletAccount,
} from '@/lib/structure';

import { createDebugLogger } from '@/lib/utils';
import { serializeWithBigInt } from '../utils/jsonBigInt';

const LOG_TIME = false;
const LOG_LEVEL = 'info';
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_WRAPPER === 'true';
const debugLog = createDebugLogger('ExchangeWrapper', DEBUG_ENABLED, LOG_TIME, LOG_LEVEL);

export type ExchangeContextType = {
  exchangeContext: ExchangeContextTypeOnly;
  setExchangeContext: (
    updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly,
    reason?: string
  ) => void;
  setSellAmount: (amount: bigint) => void;
  setBuyAmount: (amount: bigint) => void;
  setSellTokenContract: (contract: TokenContract | undefined) => void;
  setBuyTokenContract: (contract: TokenContract | undefined) => void;
  setTradeDirection: (type: TRADE_DIRECTION) => void;
  setSlippageBps: (bps: number) => void;
  setRecipientAccount: (wallet: WalletAccount | undefined) => void;
  errorMessage: ErrorMessage | undefined;
  setErrorMessage: (error: ErrorMessage | undefined) => void;
  apiErrorMessage: ErrorMessage | undefined;
  setApiErrorMessage: (error: ErrorMessage | undefined) => void;
};

export const ExchangeContextState = createContext<ExchangeContextType | null>(null);

function updateExchangeContext(
  setFn: React.Dispatch<React.SetStateAction<ExchangeContextTypeOnly | undefined>>,
  updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly,
  reason: string
) {
  setFn((prev) => {
    const updated = prev ? updater(structuredClone(prev)) : prev;

    if (serializeWithBigInt(updated) === serializeWithBigInt(prev)) return prev;

    const reasonText = reason || '⚠️ unknown update (reason was undefined)';
    debugLog.log(`🛠️ updateExchangeContext() called → reason: ${reasonText}`);

    if (prev && updated && updated.network?.chainId !== prev.network?.chainId) {
      debugLog.warn(
        `⚠️ network.chainId changed in updateExchangeContext → ${prev.network?.chainId} ➝ ${updated.network?.chainId} 🔁 reason: ${reason}`
      );
    }

    if (updated) {
      debugLog.log('📤 Preview updated context BEFORE saveLocalExchangeContext()');
      debugLog.debug(updated);
      saveLocalExchangeContext(updated);
      debugLog.log('📦 exchangeContext saved to localStorage');
    }

    return updated;
  });
}

export function ExchangeWrapper({ children }: { children: React.ReactNode }) {
  const chainId = useChainId();
  const { address, isConnected } = useAccount();

  const [contextState, setContextState] = useState<ExchangeContextTypeOnly | undefined>();
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | undefined>();
  const [apiErrorMessage, setApiErrorMessage] = useState<ErrorMessage | undefined>();
  const hasInitializedRef = useRef(false);

  const setExchangeContext = (
    updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly,
    reason: string
  ) => updateExchangeContext(setContextState, updater, reason);

  const setRecipientAccount = (wallet: WalletAccount | undefined) => {
    setExchangeContext((prev) => {
      const old = prev.accounts.recipientAccount;
      const reason = `ExchangeWrapper updating recipientAccount from ${JSON.stringify(old)} to ${JSON.stringify(wallet)}`;
      debugLog.log(`reason: ${reason}`);
      if (JSON.stringify(old) === JSON.stringify(wallet)) return prev;
      const cloned = structuredClone(prev);
      cloned.accounts.recipientAccount = wallet;
      return cloned;
    }, 'ExchangeWrapper.recipientAccount');
  };

  const setSellAmount = (amount: bigint) => {
    setExchangeContext((prev) => {
      const old = prev.tradeData.sellTokenContract?.amount;
      const reason = `ExchangeWrapper updating sellAmount from ${old} to ${amount}`;
      debugLog.log(`reason: ${reason}`);
      if (old === amount) return prev;
      const cloned = structuredClone(prev);
      if (cloned.tradeData.sellTokenContract) {
        cloned.tradeData.sellTokenContract.amount = amount;
      }
      return cloned;
    }, 'ExchangeWrapper.sellAmount');
  };

  const setBuyAmount = (amount: bigint) => {
    setExchangeContext((prev) => {
      const old = prev.tradeData.buyTokenContract?.amount;
      const reason = `ExchangeWrapper updating buyAmount from ${old} to ${amount}`;
      debugLog.log(`reason: ${reason}`);
      if (old === amount) return prev;
      const cloned = structuredClone(prev);
      if (cloned.tradeData.buyTokenContract) {
        cloned.tradeData.buyTokenContract.amount = amount;
      }
      return cloned;
    }, 'ExchangeWrapper.buyAmount');
  };

  const setSellTokenContract = (contract: TokenContract | undefined) => {
    setExchangeContext((prev) => {
      const old = prev.tradeData.sellTokenContract;
      const reason = `ExchangeWrapper updating sellTokenContract from ${JSON.stringify(old)} to ${JSON.stringify(contract)}`;
      debugLog.log(`reason: ${reason}`);
      if (JSON.stringify(old) === JSON.stringify(contract)) return prev;
      const cloned = structuredClone(prev);
      cloned.tradeData.sellTokenContract = contract;
      return cloned;
    }, 'ExchangeWrapper.sellTokenContract');
  };

  const setBuyTokenContract = (contract: TokenContract | undefined) => {
    setExchangeContext((prev) => {
      const old = prev.tradeData.buyTokenContract;
      const reason = `ExchangeWrapper updating buyTokenContract from ${JSON.stringify(old)} to ${JSON.stringify(contract)}`;
      debugLog.log(`reason: ${reason}`);
      if (JSON.stringify(old) === JSON.stringify(contract)) return prev;
      const cloned = structuredClone(prev);
      cloned.tradeData.buyTokenContract = contract;
      return cloned;
    }, 'ExchangeWrapper.buyTokenContract');
  };

  const setTradeDirection = (type: TRADE_DIRECTION) => {
    setExchangeContext((prev) => {
      const old = prev.tradeData.tradeDirection;
      const reason = `ExchangeWrapper updating tradeDirection from ${old} to ${type}`;
      debugLog.log(`reason: ${reason}`);
      if (old === type) return prev;
      const cloned = structuredClone(prev);
      cloned.tradeData.tradeDirection = type;
      return cloned;
    }, 'ExchangeWrapper.tradeDirection');
  };

  const setSlippageBps = (bps: number) => {
    setExchangeContext((prev) => {
      const old = prev.tradeData.slippage?.bps;
      const reason = `ExchangeWrapper updating slippage.bps from ${old} to ${bps}`;
      debugLog.log(`reason: ${reason}`);
      if (old === bps) return prev;
      const cloned = structuredClone(prev);
      cloned.tradeData.slippage.bps = bps;
      return cloned;
    }, 'ExchangeWrapper.slippage.bps');
  };

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    initExchangeContext(chainId, isConnected, address).then((sanitized) => {
      debugLog.log('✅ Initial exchangeContext hydrated');
      console.debug(sanitized);
      setContextState(sanitized);
    });
  }, [chainId, address, isConnected]);

  return (
    <ExchangeContextState.Provider
      value={{
        exchangeContext: {
          ...contextState,
          errorMessage,
          apiErrorMessage,
        } as ExchangeContextTypeOnly,
        setExchangeContext,
        setSellAmount,
        setBuyAmount,
        setSellTokenContract,
        setBuyTokenContract,
        setTradeDirection,
        setSlippageBps,
        setRecipientAccount,
        errorMessage,
        setErrorMessage,
        apiErrorMessage,
        setApiErrorMessage,
      }}
    >
      {contextState && children}
    </ExchangeContextState.Provider>
  );
}
