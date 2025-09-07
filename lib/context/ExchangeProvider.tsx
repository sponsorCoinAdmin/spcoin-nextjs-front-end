// File: lib/context/ExchangeProvider.tsx
'use client';

import React, { createContext, useEffect, useRef, useState } from 'react';
import { useAccount, useChainId as useWagmiChainId } from 'wagmi';
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
import { useProviderSetters } from '@/lib/context/providers/Exchange/useProviderSetters';
import { useProviderWatchers } from '@/lib/context/providers/Exchange/useProviderWatchers';
import { deriveNetworkFromApp } from '@/lib/context/helpers/NetworkHelpers';

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

  setSellAmount: (amount: bigint) => void;
  setBuyAmount: (amount: bigint) => void;
  setSellTokenContract: (contract: TokenContract | undefined) => void;
  setBuyTokenContract: (contract: TokenContract | undefined) => void;
  setTradeDirection: (type: TRADE_DIRECTION) => void;
  setSlippageBps: (bps: number) => void;
  setRecipientAccount: (wallet: WalletAccount | undefined) => void;
  setAppChainId: (chainId: number) => void;

  errorMessage: ErrorMessage | undefined;
  setErrorMessage: (error: ErrorMessage | undefined) => void;
  apiErrorMessage: ErrorMessage | undefined;
  setApiErrorMessage: (error: ErrorMessage | undefined) => void;
};

export const ExchangeContextState = createContext<ExchangeContextType | null>(null);

function ExchangeRuntime({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function ExchangeProvider({ children }: { children: React.ReactNode }) {
  // Wallet info (for bootstrap + address/status only)
  const wagmiChainId = useWagmiChainId();
  const { address, isConnected, status: accountStatus } = useAccount();

  // Provider state
  const [contextState, setContextState] = useState<ExchangeContextTypeOnly | undefined>();
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | undefined>();
  const [apiErrorMessage, setApiErrorMessage] = useState<ErrorMessage | undefined>();
  const hasInitializedRef = useRef(false);

  // Public setter with persistence + debug
  const setExchangeContext = (
    updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly,
    hookName = 'unknown'
  ) => {
    setContextState((prev) => {
      if (DEBUG_ENABLED) debugLog.log('info', `🛠️ setExchangeContext → triggered by ${hookName}`);
      const next = prev ? updater(prev) : prev;
      if (!next || next === prev) return prev; // no real change

      saveLocalExchangeContext(next);
      if (DEBUG_ENABLED) debugLog.log('info', '📦 exchangeContext → saved to localStorage');
      return next;
    });
  };

  // Initial hydration from localStorage + wallet chain (bootstrap only)
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    initExchangeContext(wagmiChainId, isConnected, address).then((sanitized) => {
      if (DEBUG_ENABLED) debugLog.log('info', `✅ Initial exchangeContext → hydrated`, sanitized);
      setContextState(sanitized);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔑 App chainId (SOURCE OF TRUTH for the UI)
  const appChainId = contextState?.network?.appChainId ?? 0;

  // Small setters
  const {
    setRecipientAccount,
    setSellAmount,
    setBuyAmount,
    setSellTokenContract,
    setBuyTokenContract,
    setTradeDirection,
    setSlippageBps,
    setAppChainId,
  } = useProviderSetters(setExchangeContext);

  // Central watchers — drive off APP chain (not the wallet)
  useProviderWatchers({
    contextState,
    setExchangeContext,
    appChainId, // <-- app-first
    isConnected,
    address,
    accountStatus,
  });

  /** Keep `network.connected` in sync with wallet connection */
  useEffect(() => {
    if (!contextState) return;

    setExchangeContext((prev) => {
      if (!prev) return prev;
      const was = !!prev.network?.connected;
      const now = !!isConnected;
      if (was === now) return prev;

      if (DEBUG_ENABLED) debugLog.log(`🛠️ syncNetworkConnected → ${was} → ${now}`);
      const next = structuredClone(prev);
      next.network = { ...(next.network ?? {}), connected: now };
      return next;
    }, 'provider:syncNetworkConnected');
  }, [isConnected, contextState, setExchangeContext]);

  /** While CONNECTED: keep `network.chainId` in sync with wallet (wagmi). */
  useEffect(() => {
    if (!contextState) return;
    if (!isConnected) return; // 🔒 only when connected

    const walletId = typeof wagmiChainId === 'number' ? wagmiChainId : undefined;

    setExchangeContext((prev) => {
      if (!prev) return prev;
      const current = prev.network?.chainId;
      if (current === walletId) return prev;

      if (DEBUG_ENABLED) debugLog.log(`🛠️ syncWalletChainId → ${current} → ${walletId}`);
      const next = structuredClone(prev);
      next.network = { ...(next.network ?? {}), chainId: walletId as any };
      return next;
    }, 'provider:syncWalletChainId(connected)');
  }, [isConnected, wagmiChainId, contextState, setExchangeContext]);

  /** While DISCONNECTED: ensure `network.chainId` is undefined. */
  useEffect(() => {
    if (!contextState) return;
    if (isConnected) return; // 🔒 only when disconnected

    const ch = contextState.network?.chainId;
    if (typeof ch === 'undefined') return; // already cleared

    setExchangeContext((prev) => {
      if (!prev) return prev;
      if (typeof prev.network?.chainId === 'undefined') return prev; // no change

      if (DEBUG_ENABLED) debugLog.log(`🛠️ clearWalletChainId(disconnected) → ${ch} → undefined`);
      const next = structuredClone(prev);
      next.network = { ...(next.network ?? {}), chainId: undefined as any };
      return next;
    }, 'provider:clearWalletChainId(disconnected)');
  }, [isConnected, contextState?.network?.chainId, contextState, setExchangeContext]);

  /** Hydrate name/symbol/logo/url from the APP chain selection (`network.appChainId`). */
  useEffect(() => {
    if (!contextState) return;
    const currentAppId = contextState.network?.appChainId ?? 0;

    setExchangeContext((prev) => {
      if (!prev) return prev;
      const prevApp = prev.network?.appChainId ?? 0;
      if (prevApp === currentAppId) return prev; // no change

      if (DEBUG_ENABLED) debugLog.log(`🛠️ hydrateFromAppChain → ${prevApp} → ${currentAppId}`);
      const next = structuredClone(prev);
      next.network = deriveNetworkFromApp(currentAppId, next.network);
      return next;
    }, 'provider:hydrateFromAppChain');
  }, [contextState?.network?.appChainId, contextState, setExchangeContext]);

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
        setAppChainId,
        // errors
        errorMessage,
        setErrorMessage,
        apiErrorMessage,
        setApiErrorMessage,
      }}
    >
      {contextState && <ExchangeRuntime>{children}</ExchangeRuntime>}
    </ExchangeContextState.Provider>
  );
}
