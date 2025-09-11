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
  SP_COIN_DISPLAY, // ← for legacy migration mapping
} from '@/lib/structure';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useProviderSetters } from '@/lib/context/providers/Exchange/useProviderSetters';
import { useProviderWatchers } from '@/lib/context/providers/Exchange/useProviderWatchers';
import { deriveNetworkFromApp } from '@/lib/context/helpers/NetworkHelpers';

// Panel-tree types & defaults
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

/* --------------------------------- Helpers -------------------------------- */

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

function isMainPanelNode(x: any): x is MainPanelNode {
  return (
    !!x &&
    typeof x === 'object' &&
    typeof x.panel === 'number' &&
    typeof x.visible === 'boolean' &&
    Array.isArray(x.children)
  );
}

const OVERLAY_GROUP: SP_COIN_DISPLAY[] = [
  SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL,
  SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL,
  SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL,
  SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL,
];
const TRADING = SP_COIN_DISPLAY.TRADING_STATION_PANEL;

function clone<T>(o: T): T {
  return typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));
}

function findNode(root: MainPanelNode | undefined, panel: SP_COIN_DISPLAY): MainPanelNode | null {
  if (!root) return null as any;
  if (root.panel === panel) return root as any;
  for (const c of root.children || []) {
    const n = findNode(c as any, panel);
    if (n) return n;
  }
  return null;
}

function setVisible(root: MainPanelNode, panel: SP_COIN_DISPLAY, visible: boolean) {
  const n = findNode(root, panel);
  if (n) n.visible = visible;
}

/**
 * One-time migration: if legacy settings.activeDisplay exists,
 * reflect it into the visibility tree (radio behavior for overlays),
 * then drop `activeDisplay` from settings.
 */
function migrateLegacyActiveDisplayToTree(
  tree: MainPanelNode,
  activeDisplay: unknown
): MainPanelNode {
  if (typeof activeDisplay !== 'number') return tree;

  const next = clone(tree);

  if (activeDisplay === TRADING) {
    OVERLAY_GROUP.forEach((p) => setVisible(next, p, false));
    setVisible(next, TRADING, true);
  } else if (OVERLAY_GROUP.includes(activeDisplay)) {
    OVERLAY_GROUP.forEach((p) => setVisible(next, p, p === activeDisplay));
    setVisible(next, TRADING, false);
  } else {
    // Non-overlay: just ensure it's visible (don’t hide others)
    setVisible(next, activeDisplay, true);
  }

  return next;
}

/* --------------------------------- Provider -------------------------------- */

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

      // Read current settings
      const settingsAny = (sanitizedBase as any).settings ?? {};
      const legacyActiveDisplay = settingsAny.activeDisplay; // may exist from old system

      // Load or seed panel tree
      let mainPanelNode: MainPanelNode | undefined = isMainPanelNode(settingsAny.mainPanelNode)
        ? (settingsAny.mainPanelNode as MainPanelNode)
        : undefined;

      if (!mainPanelNode) {
        mainPanelNode = ensurePanelNames(defaultMainPanelNode);
        if (DEBUG_ENABLED) debugLog.log('info', '🌱 Seeded mainPanelNode from default');
      } else {
        mainPanelNode = ensurePanelNames(mainPanelNode);
      }

      // One-time migration from legacy activeDisplay → tree
      if (typeof legacyActiveDisplay === 'number') {
        const migrated = migrateLegacyActiveDisplayToTree(mainPanelNode, legacyActiveDisplay);
        mainPanelNode = ensurePanelNames(migrated);

        // drop legacy key from settings going forward
        const { activeDisplay: _drop, ...rest } = settingsAny;
        (sanitizedBase as any).settings = { ...rest, mainPanelNode };

        try {
          saveLocalExchangeContext(sanitizedBase);
          if (DEBUG_ENABLED) debugLog.log('info', '🧹 Migrated activeDisplay → tree and removed legacy key');
        } catch (e) {
          if (DEBUG_ENABLED) debugLog.warn('⚠️ Failed to persist after migration', e);
        }
      } else if (!settingsAny.mainPanelNode) {
        // Save seeded tree if it didn’t exist
        (sanitizedBase as any).settings = { ...settingsAny, mainPanelNode };
        try {
          saveLocalExchangeContext(sanitizedBase);
          if (DEBUG_ENABLED) debugLog.log('info', '💾 Saved seeded mainPanelNode into exchangeContext');
        } catch (e) {
          if (DEBUG_ENABLED) debugLog.warn('⚠️ Failed to save seeded mainPanelNode', e);
        }
      } else {
        // Ensure normalized names are written back once
        (sanitizedBase as any).settings = { ...settingsAny, mainPanelNode };
        try {
          saveLocalExchangeContext(sanitizedBase);
        } catch {
          /* ignore */
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

    const baseCtx: any = { ...(contextState as ExchangeContextTypeOnly) };
    const namedTree = ensurePanelNames(contextState.mainPanelNode);

    // Drop any lingering legacy activeDisplay when saving (safety)
    const { activeDisplay: _drop, ...currSettings } = baseCtx.settings ?? {};

    baseCtx.settings = { ...currSettings, mainPanelNode: namedTree };

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
