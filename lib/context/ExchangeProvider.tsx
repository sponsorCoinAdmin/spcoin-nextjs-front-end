// File: lib/context/ExchangeProvider.tsx
'use client';

import React, { createContext, useEffect, useRef, useState } from 'react';
import { useAccount, useChainId as useWagmiChainId } from 'wagmi';
import { saveLocalExchangeContext } from '@/lib/context/helpers/ExchangeSaveHelpers';
import { initExchangeContext } from '@/lib/context/helpers/initExchangeContext';
import { ensurePanelNames } from '@/lib/context/exchangeContext/helpers/panelNames';

import {
  ExchangeContext as ExchangeContextTypeOnly,
  TRADE_DIRECTION,
  TokenContract,
  ErrorMessage,
  WalletAccount,
  NetworkElement,
} from '@/lib/structure';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useProviderSetters } from '@/lib/context/providers/Exchange/useProviderSetters';
import { useProviderWatchers } from '@/lib/context/providers/Exchange/useProviderWatchers';
import { deriveNetworkFromApp } from '@/lib/context/helpers/NetworkHelpers';

// Panel-tree types & defaults (no separate storage key anymore)
import {
  ExchangeContextWithPanels,
  defaultMainPanelNode,
} from '@/lib/structure/exchangeContext';
import type { MainPanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';

import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

const LOG_TIME = false;
const LOG_LEVEL = 'info';
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_WRAPPER === 'true';
const debugLog = createDebugLogger('ExchangeProvider', DEBUG_ENABLED, LOG_TIME, LOG_LEVEL);

// Store extended internally, expose base publicly (incremental change)
type ExtendedExchangeContext = ExchangeContextTypeOnly & ExchangeContextWithPanels;

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

// ✅ Strong helper so `network` never becomes `{}` (which breaks typing)
function ensureNetwork(n?: Partial<NetworkElement>): NetworkElement {
  return {
    connected: !!n?.connected,
    appChainId: n?.appChainId ?? 0,
    chainId: (n?.chainId as any) ?? undefined,
    logoURL: n?.logoURL ?? '',
    name: n?.name ?? '',
    symbol: n?.symbol ?? '',
    url: n?.url ?? '',
  };
}

// 🔎 Narrow shape check for a PanelNode tree
function isMainPanelNode(x: any): x is MainPanelNode {
  return (
    !!x &&
    typeof x === 'object' &&
    typeof x.panel === 'number' &&
    typeof x.visible === 'boolean' &&
    Array.isArray(x.children)
  );
}

export function ExchangeProvider({ children }: { children: React.ReactNode }) {
  const wagmiChainId = useWagmiChainId();
  const { address, isConnected, status: accountStatus } = useAccount();

  const [contextState, setContextState] = useState<ExtendedExchangeContext | undefined>();
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | undefined>();
  const [apiErrorMessage, setApiErrorMessage] = useState<ErrorMessage | undefined>();
  const hasInitializedRef = useRef(false);

  // Public setter (base-typed); merge back into extended so panel tree persists
  const setExchangeContext = (
    updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly,
    hookName = 'unknown'
  ) => {
    setContextState((prev) => {
      if (!prev) return prev;
      if (DEBUG_ENABLED) debugLog.log('info', `🛠️ setExchangeContext → triggered by ${hookName}`);

      const prevBase: ExchangeContextTypeOnly = prev;
      const nextBase = updater(prevBase);
      if (!nextBase) return prev;

      const nextExtended: ExtendedExchangeContext = {
        ...prev,
        ...nextBase,
        mainPanelNode: prev.mainPanelNode, // preserve panel tree in memory
      };

      try {
        // Persist the updated base context (panel tree is saved by a separate effect below)
        saveLocalExchangeContext(nextBase);
      } catch (e) {
        if (DEBUG_ENABLED) debugLog.warn('⚠️ saveLocalExchangeContext failed', e);
      }

      if (stringifyBigInt(prevBase) === stringifyBigInt(nextBase)) return prev;
      return nextExtended;
    });
  };

  // Initial hydration (async)
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    (async () => {
      const sanitizedBase = await initExchangeContext(wagmiChainId, isConnected, address);

      // 🔁 Read panel settings from exchangeContext.settings.mainPanelNode
      const settingsAny = (sanitizedBase as any).settings ?? {};
      let mainPanelNode: MainPanelNode | undefined = isMainPanelNode(settingsAny.mainPanelNode)
        ? (settingsAny.mainPanelNode as MainPanelNode)
        : undefined;

      // Normalize names for human readability
      if (mainPanelNode) {
        mainPanelNode = ensurePanelNames(mainPanelNode);
      }

      // If missing/invalid → seed from default (with names) and store back into exchangeContext.settings
      if (!mainPanelNode) {
        mainPanelNode = ensurePanelNames(defaultMainPanelNode);
        (sanitizedBase as any).settings = { ...settingsAny, mainPanelNode };
        try {
          saveLocalExchangeContext(sanitizedBase);
          if (DEBUG_ENABLED)
            debugLog.log('info', '🌱 Seeded settings.mainPanelNode (named) from default and saved exchangeContext');
        } catch (e) {
          if (DEBUG_ENABLED) debugLog.warn('⚠️ Failed saving seeded mainPanelNode into exchangeContext', e);
        }
      } else {
        // If we normalized (added names), write back once so storage stays human-readable
        (sanitizedBase as any).settings = { ...settingsAny, mainPanelNode };
        try {
          saveLocalExchangeContext(sanitizedBase);
          if (DEBUG_ENABLED)
            debugLog.log('info', '🌳 settings.mainPanelNode normalized with names and saved');
        } catch (e) {
          if (DEBUG_ENABLED) debugLog.warn('⚠️ Failed to persist normalized mainPanelNode', e);
        }
      }

      const withPanels: ExtendedExchangeContext = {
        ...(sanitizedBase as ExchangeContextTypeOnly),
        mainPanelNode,
      };

      if (DEBUG_ENABLED) debugLog.log('info', `✅ Initial exchangeContext → hydrated`);
      setContextState(withPanels);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const appChainId = contextState?.network?.appChainId ?? 0;

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

  useProviderWatchers({
    contextState,
    setExchangeContext,
    appChainId,
    isConnected,
    address,
    accountStatus,
  });

  // Keep `network.connected` in sync with wallet connection
  useEffect(() => {
    if (!contextState) return;

    setExchangeContext((prev) => {
      const was = !!prev.network?.connected;
      const now = !!isConnected;
      if (was === now) return prev;

      const next = structuredClone(prev);
      const net = ensureNetwork(next.network);
      net.connected = now;
      next.network = net;
      return next;
    }, 'provider:syncNetworkConnected');
  }, [isConnected, contextState, setExchangeContext]);

  // While CONNECTED: keep `network.chainId` in sync with wallet (wagmi).
  useEffect(() => {
    if (!contextState) return;
    if (!isConnected) return;

    const walletId = typeof wagmiChainId === 'number' ? wagmiChainId : undefined;

    setExchangeContext((prev) => {
      const current = prev.network?.chainId;
      if (current === walletId) return prev;

      const next = structuredClone(prev);
      const net = ensureNetwork(next.network);
      net.chainId = walletId as any;
      next.network = net;
      return next;
    }, 'provider:syncWalletChainId(connected)');
  }, [isConnected, wagmiChainId, contextState, setExchangeContext]);

  // While DISCONNECTED: ensure `network.chainId` is undefined.
  useEffect(() => {
    if (!contextState) return;
    if (isConnected) return;

    const ch = contextState.network?.chainId;
    if (typeof ch === 'undefined') return;

    setExchangeContext((prev) => {
      if (typeof prev.network?.chainId === 'undefined') return prev;

      const next = structuredClone(prev);
      const net = ensureNetwork(next.network);
      net.chainId = undefined as any;
      next.network = net;
      return next;
    }, 'provider:clearWalletChainId(disconnected)');
  }, [isConnected, contextState?.network?.chainId, contextState, setExchangeContext]);

  // Hydrate name/symbol/logo/url from the APP chain selection (`network.appChainId`).
  useEffect(() => {
    if (!contextState) return;
    const currentAppId = contextState.network?.appChainId ?? 0;

    setExchangeContext((prev) => {
      const prevApp = prev.network?.appChainId ?? 0;
      if (prevApp === currentAppId) return prev;

      const next = structuredClone(prev);
      next.network = deriveNetworkFromApp(currentAppId, next.network);
      return next;
    }, 'provider:hydrateFromAppChain');
  }, [contextState?.network?.appChainId, contextState, setExchangeContext]);

  // 💾 Persist panel tree *inside* exchangeContext.settings on any change (and ensure names)
  useEffect(() => {
    if (!contextState?.mainPanelNode) return;

    // Take the current base exchangeContext (drop Extended-only fields)
    const baseCtx: any = { ...(contextState as ExchangeContextTypeOnly) };

    // Normalize names right before saving so storage is always human-readable
    const namedTree = ensurePanelNames(contextState.mainPanelNode);

    // Ensure settings bag exists and store full MainPanelNode with names
    baseCtx.settings = { ...(baseCtx.settings ?? {}), mainPanelNode: namedTree };

    try {
      saveLocalExchangeContext(baseCtx);
      if (DEBUG_ENABLED) debugLog.log('info', '💾 settings.mainPanelNode (named) → saved inside exchangeContext');
    } catch (e) {
      if (DEBUG_ENABLED) debugLog.warn('⚠️ Failed to save settings.mainPanelNode into exchangeContext', e);
    }
  }, [contextState?.mainPanelNode]);

  // Don’t render until hydrated
  if (!contextState) return null;

  return (
    <ExchangeContextState.Provider
      value={{
        exchangeContext: {
          ...(contextState as ExchangeContextTypeOnly),
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
      {children}
    </ExchangeContextState.Provider>
  );
}
