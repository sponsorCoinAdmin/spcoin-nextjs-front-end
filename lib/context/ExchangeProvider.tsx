// File: lib/context/ExchangeProvider.tsx
'use client';

import React, { createContext, useEffect, useRef, useState } from 'react';
import { useChainId, useAccount } from 'wagmi';
import { saveLocalExchangeContext } from '@/lib/context/helpers/ExchangeSaveHelpers';
import { initExchangeContext } from '@/lib/context/helpers/initExchangeContext';

import {
  ExchangeContext as ExchangeContextTypeOnly,
  TRADE_DIRECTION,
  TokenContract,
  ErrorMessage,
  WalletAccount,
} from '@/lib/structure';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useActiveAccount } from '@/lib/context/hooks/nestedHooks/useActiveAccount';
import { useProviderSetters } from '@/lib/context/providers/Exchange/useProviderSetters';
import { useProviderWatchers } from '@/lib/context/providers/Exchange/useProviderWatchers';

// ✅ new provider-internal hooks (moved code out of this file)

const LOG_TIME = false;
const LOG_LEVEL = 'info';
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_WRAPPER === 'true';
const debugLog = createDebugLogger('ExchangeProvider', DEBUG_ENABLED, LOG_TIME, LOG_LEVEL);

export type ExchangeContextType = {
  exchangeContext: ExchangeContextTypeOnly;
  setExchangeContext: (
    updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly,
    hookName?: string
  ) => void;

  // convenience setters (provided by useProviderSetters)
  setSellAmount: (amount: bigint) => void;
  setBuyAmount: (amount: bigint) => void;
  setSellTokenContract: (contract: TokenContract | undefined) => void;
  setBuyTokenContract: (contract: TokenContract | undefined) => void;
  setTradeDirection: (type: TRADE_DIRECTION) => void;
  setSlippageBps: (bps: number) => void;
  setRecipientAccount: (wallet: WalletAccount | undefined) => void;

  // errors
  errorMessage: ErrorMessage | undefined;
  setErrorMessage: (error: ErrorMessage | undefined) => void;
  apiErrorMessage: ErrorMessage | undefined;
  setApiErrorMessage: (error: ErrorMessage | undefined) => void;
};

export const ExchangeContextState = createContext<ExchangeContextType | null>(null);

/** Runs side-effect hooks that require ExchangeContext to be available. */
function ExchangeRuntime({ children }: { children: React.ReactNode }) {
  // ✅ This runs inside the Provider, so useExchangeContext() inside the hook is safe.
  useActiveAccount();
  return <>{children}</>;
}

export function ExchangeProvider({ children }: { children: React.ReactNode }) {
  // ---- single external sources of truth (wagmi) ----
  const wagmiChainId = useChainId();
  const { address, isConnected, status: accountStatus } = useAccount();

  // ---- provider state ----
  const [contextState, setContextState] = useState<ExchangeContextTypeOnly | undefined>();
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | undefined>();
  const [apiErrorMessage, setApiErrorMessage] = useState<ErrorMessage | undefined>();
  const hasInitializedRef = useRef(false);

  // ---- public setter with persistence + debug ----
  const setExchangeContext = (
    updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly,
    hookName = 'unknown'
  ) => {
    setContextState((prev) => {
      DEBUG_ENABLED && debugLog.log('info', '🧪 setExchangeContext triggered by', hookName);
      const updated = prev ? updater(structuredClone(prev)) : prev;
      if (updated) {
        saveLocalExchangeContext(updated);
        DEBUG_ENABLED && debugLog.log('info', '📦 exchangeContext saved to localStorage');
      }
      return updated;
    });
  };

  // ---- initial hydration from localStorage + wagmi ----
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    initExchangeContext(wagmiChainId, isConnected, address).then((sanitized) => {
      DEBUG_ENABLED && debugLog.log('info', '✅ Initial exchangeContext hydrated', sanitized);
      setContextState(sanitized);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- import small setters (removed verbose inline implementations) ----
  const {
    setRecipientAccount,
    setSellAmount,
    setBuyAmount,
    setSellTokenContract,
    setBuyTokenContract,
    setTradeDirection,
    setSlippageBps,
  } = useProviderSetters(setExchangeContext);

  // ---- central watchers extracted (removes 150+ lines from this file) ----
  useProviderWatchers({
    contextState,
    setExchangeContext,
    wagmiChainId,
    isConnected,
    address,
    accountStatus,
  });

  return (
    <ExchangeContextState.Provider
      value={{
        exchangeContext: {
          ...contextState,
          errorMessage,
          apiErrorMessage,
        } as ExchangeContextTypeOnly,
        setExchangeContext,
        // setters
        setSellAmount,
        setBuyAmount,
        setSellTokenContract,
        setBuyTokenContract,
        setTradeDirection,
        setSlippageBps,
        setRecipientAccount,
        // errors
        errorMessage,
        setErrorMessage,
        apiErrorMessage,
        setApiErrorMessage,
      }}
    >
      {/* Only render runtime + children after context is ready */}
      {contextState && <ExchangeRuntime>{children}</ExchangeRuntime>}
    </ExchangeContextState.Provider>
  );
}
