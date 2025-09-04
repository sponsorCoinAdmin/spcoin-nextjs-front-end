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
      DEBUG_ENABLED && debugLog.log('info', '🧪 setExchangeContext triggered by', hookName);

      // Pass real prev; let updater decide if change is needed
      const next = prev ? updater(prev) : prev;
      if (!next || next === prev) return prev; // no real change

      saveLocalExchangeContext(next);
      DEBUG_ENABLED && debugLog.log('info', '📦 exchangeContext saved to localStorage');
      return next;
    });
  };

  // Initial hydration from localStorage + wallet chain (bootstrap only)
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    initExchangeContext(wagmiChainId, isConnected, address).then((sanitized) => {
      DEBUG_ENABLED && debugLog.log('info', '✅ Initial exchangeContext hydrated', sanitized);
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
  } = useProviderSetters(setExchangeContext);

  // Central watchers — drive off APP chain (not the wallet)
  useProviderWatchers({
    contextState,
    setExchangeContext,
    appChainId, // <-- app-first
    isConnected,
    address,
    accountStatus,
    // If some watchers legitimately need wallet chain for validation, you can also pass:
    // walletChainId: wagmiChainId,
  });

  /** Keep `network.connected` in sync with wallet connection */
  useEffect(() => {
    if (!contextState) return;

    setExchangeContext((prev) => {
      if (!prev) return prev;
      const was = !!prev.network?.connected;
      const now = !!isConnected;
      if (was === now) return prev;

      const next = structuredClone(prev);
      next.network = { ...(next.network ?? {}), connected: now };
      return next;
    }, 'provider:syncNetworkConnected');
  }, [isConnected, contextState, setExchangeContext]);

  /**
   * While CONNECTED: keep `network.chainId` in sync with wallet (wagmi).
   * (Avoids fighting the app selection while disconnected.)
   */
  useEffect(() => {
    if (!contextState) return;
    if (!isConnected) return; // 🔒 only when connected

    const walletId = typeof wagmiChainId === 'number' ? wagmiChainId : 0;

    setExchangeContext((prev) => {
      if (!prev) return prev;
      const current = prev.network?.chainId ?? 0;
      if (current === walletId) return prev;

      const next = structuredClone(prev);
      next.network = { ...(next.network ?? {}), chainId: walletId };
      return next;
    }, 'provider:syncWalletChainId(connected)');
  }, [isConnected, wagmiChainId, contextState, setExchangeContext]);

  /**
   * While DISCONNECTED: mirror `network.chainId` to `network.appChainId`
   * so the app uses the selected chain immediately (no flashing back).
   */
  useEffect(() => {
    if (!contextState) return;
    if (isConnected) return; // 🔒 only when disconnected

    const app = contextState.network?.appChainId ?? 0;
    const ch  = contextState.network?.chainId ?? 0;
    if (app > 0 && ch !== app) {
      setExchangeContext((prev) => {
        if (!prev) return prev;
        const next = structuredClone(prev);
        next.network = { ...(next.network ?? {}), chainId: app };
        return next;
      }, 'provider:mirrorChainIdToApp(disconnected)');
    }
  }, [
    isConnected,
    contextState?.network?.appChainId,
    contextState?.network?.chainId,
    contextState,
    setExchangeContext,
  ]);

  /**
   * Hydrate name/symbol/logo/url from the APP chain selection (`network.appChainId`).
   * Does not modify `network.chainId` (wallet) or `connected`.
   */
  useEffect(() => {
    if (!contextState) return;
    const currentAppId = contextState.network?.appChainId ?? 0;

    setExchangeContext((prev) => {
      if (!prev) return prev;
      const prevApp = prev.network?.appChainId ?? 0;
      if (prevApp === currentAppId) return prev; // no change

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
