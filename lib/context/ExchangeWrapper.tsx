// File: lib/context/ExchangeWrapper.tsx

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

import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const LOG_LEVEL = 'info';
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_WRAPPER === 'true';
const debugLog = createDebugLogger('ExchangeWrapper', DEBUG_ENABLED, LOG_TIME, LOG_LEVEL);

export type ExchangeContextType = {
  exchangeContext: ExchangeContextTypeOnly;
  setExchangeContext: (
    updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly,
    hookName?: string
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

export function ExchangeWrapper({ children }: { children: React.ReactNode }) {
  const chainId = useChainId();
  const { address, isConnected } = useAccount();

  const [contextState, setContextState] = useState<ExchangeContextTypeOnly | undefined>();
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | undefined>();
  const [apiErrorMessage, setApiErrorMessage] = useState<ErrorMessage | undefined>();
  const hasInitializedRef = useRef(false);

  const setExchangeContext = (
    updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly,
    hookName = 'unknown'
  ) => {
    setContextState((prev) => {
      debugLog.log('🧪 setExchangeContext triggered by', hookName);

      const updated = prev ? updater(structuredClone(prev)) : prev;

      if (prev && updated && updated.network?.chainId !== prev.network?.chainId) {
        debugLog.warn(
          `⚠️ network.chainId changed in setExchangeContext → ${prev.network?.chainId} ➝ ${updated.network?.chainId} 🔁 hook: ${hookName}`
        );
      }

      if (updated) {
        saveLocalExchangeContext(updated);
        debugLog.log('📦 exchangeContext saved to localStorage');
      }

      return updated;
    });
  };

  const setRecipientAccount = (wallet: WalletAccount | undefined) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      cloned.accounts.recipientAccount = wallet;
      return cloned;
    }, 'setRecipientAccount');
  };

  const setSellAmount = (amount: bigint) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      if (cloned.tradeData.sellTokenContract) {
        cloned.tradeData.sellTokenContract.amount = amount;
      }
      return cloned;
    }, 'setSellAmount');
  };

  const setBuyAmount = (amount: bigint) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      if (cloned.tradeData.buyTokenContract) {
        cloned.tradeData.buyTokenContract.amount = amount;
      }
      return cloned;
    }, 'setBuyAmount');
  };

  const setSellTokenContract = (contract: TokenContract | undefined) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      cloned.tradeData.sellTokenContract = contract;
      return cloned;
    }, 'setSellTokenContract');
  };

  const setBuyTokenContract = (contract: TokenContract | undefined) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      cloned.tradeData.buyTokenContract = contract;
      return cloned;
    }, 'setBuyTokenContract');
  };

  const setTradeDirection = (type: TRADE_DIRECTION) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      cloned.tradeData.tradeDirection = type;
      return cloned;
    }, 'setTradeDirection');
  };

  const setSlippageBps = (bps: number) => {
    debugLog.log('🧾 setSlippageBps:', bps);
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      cloned.tradeData.slippage.bps = bps;
      return cloned;
    }, 'setSlippageBps');
  };

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    initExchangeContext(chainId, isConnected, address).then((sanitized) => {
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
      {children}
    </ExchangeContextState.Provider>
  );
}
