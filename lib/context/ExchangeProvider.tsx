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
  NetworkElement,
  SP_COIN_DISPLAY,
} from '@/lib/structure';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useProviderSetters } from '@/lib/context/providers/Exchange/useProviderSetters';
import { useProviderWatchers } from '@/lib/context/providers/Exchange/useProviderWatchers';
import { deriveNetworkFromApp } from '@/lib/context/helpers/NetworkHelpers';

// Panels (default flat list)
import { defaultMainPanels } from '@/lib/structure/exchangeContext/constants/defaultPanelTree';
import type {
  PanelNode,
  MainPanelNode, // legacy tree node (for migration only)
} from '@/lib/structure/exchangeContext/types/PanelNode';

import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

const LOG_TIME = false;
const LOG_LEVEL = 'info';
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_WRAPPER === 'true';
const debugLog = createDebugLogger('ExchangeProvider', DEBUG_ENABLED, LOG_TIME, LOG_LEVEL);

/* ---------------------------- Types & Context API --------------------------- */

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

// Legacy tree shape check
function isLegacyMainPanelNode(x: any): x is MainPanelNode {
  return (
    !!x &&
    typeof x === 'object' &&
    typeof x.panel === 'number' &&
    typeof x.visible === 'boolean' &&
    Array.isArray(x.children)
  );
}

// New flat shape check
function isMainPanels(x: any): x is PanelNode[] {
  return (
    Array.isArray(x) &&
    x.every(
      (n) =>
        n &&
        typeof n === 'object' &&
        typeof (n as any).panel === 'number' &&
        typeof (n as any).visible === 'boolean' &&
        Array.isArray((n as any).children)
    )
  );
}

// Ensure human-readable names for a single node
function ensurePanelName(n: PanelNode): PanelNode {
  return {
    ...n,
    name: n.name || (SP_COIN_DISPLAY[n.panel] ?? String(n.panel)),
    children: n.children?.map(ensurePanelName) ?? [],
  };
}

// Ensure names across a flat list
function ensurePanelNamesFlat(panels: PanelNode[]): PanelNode[] {
  return panels.map(ensurePanelName);
}

// Flatten legacy root→children into a flat list (root first, then its direct children)
function legacyTreeToFlatPanels(root: MainPanelNode): PanelNode[] {
  const flat: PanelNode[] = [];
  const push = (n: MainPanelNode) => {
    flat.push({
      panel: n.panel,
      name: n.name || (SP_COIN_DISPLAY[n.panel] ?? String(n.panel)),
      visible: n.visible,
      children: n.children?.map(ensurePanelName) ?? [],
    });
  };
  push(root);
  for (const c of root.children || []) push(c as MainPanelNode);
  return flat;
}

// Ensure SPONSOR_RATE_CONFIG_PANEL is never persisted to storage
const excludeSponsorFromPanels = (panels: PanelNode[]): PanelNode[] =>
  panels.filter((p) => p.panel !== SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG_PANEL);

/* --------------------------------- Provider -------------------------------- */

export function ExchangeProvider({ children }: { children: React.ReactNode }) {
  const wagmiChainId = useWagmiChainId();
  const { address, isConnected, status: accountStatus } = useAccount();

  const [contextState, setContextState] = useState<ExchangeContextTypeOnly | undefined>();
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | undefined>();
  const [apiErrorMessage, setApiErrorMessage] = useState<ErrorMessage | undefined>();
  const hasInitializedRef = useRef(false);

  // Base setter persists to localStorage; panel list lives under settings.mainPanelNode
  const setExchangeContext = (
    updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly,
    hookName = 'unknown'
  ) => {
    setContextState((prev) => {
      if (!prev) return prev;
      if (DEBUG_ENABLED) debugLog.log('info', `🛠️ setExchangeContext → triggered by ${hookName}`);

      const nextBase = updater(prev);
      if (!nextBase) return prev;

      // Create a sanitized copy for persistence (strip sponsor panel)
      let toSave =
        typeof structuredClone === 'function'
          ? structuredClone(nextBase)
          : JSON.parse(JSON.stringify(nextBase));
      try {
        const maybePanels: PanelNode[] | undefined = (toSave as any)?.settings?.mainPanelNode;
        if (Array.isArray(maybePanels)) {
          (toSave as any).settings.mainPanelNode = excludeSponsorFromPanels(
            ensurePanelNamesFlat(maybePanels)
          );
        }
      } catch {
        // ignore sanitize errors; fall back to saving as-is
      }

      try {
        saveLocalExchangeContext(toSave);
      } catch (e) {
        if (DEBUG_ENABLED) debugLog.warn('⚠️ saveLocalExchangeContext failed', e);
      }

      if (stringifyBigInt(prev) === stringifyBigInt(nextBase)) return prev;
      return nextBase;
    });
  };

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    (async () => {
      const sanitizedBase = await initExchangeContext(wagmiChainId, isConnected, address);
      const settingsAny = (sanitizedBase as any).settings ?? {};
      const stored = settingsAny.mainPanelNode;

      let flatPanels: PanelNode[];

      if (isMainPanels(stored)) {
        // Already flat → ensure names
        flatPanels = ensurePanelNamesFlat(stored);
      } else if (isLegacyMainPanelNode(stored)) {
        // Legacy tree → flatten
        flatPanels = ensurePanelNamesFlat(legacyTreeToFlatPanels(stored));
      } else {
        // Nothing valid → seed default
        flatPanels = ensurePanelNamesFlat(defaultMainPanels);
      }

      // Always exclude sponsor panel from persisted panels
      flatPanels = excludeSponsorFromPanels(flatPanels);

      // Persist normalized panels (sanitizer handles legacy key cleanup)
      (sanitizedBase as any).settings = { ...settingsAny, mainPanelNode: flatPanels };

      // Persist once post-migration/normalization
      try {
        saveLocalExchangeContext(sanitizedBase);
        if (DEBUG_ENABLED) {
          const vis = flatPanels
            .map((p) => `${SP_COIN_DISPLAY[p.panel]}:${p.visible ? 1 : 0}`)
            .join(' | ');
          debugLog.log('info', `💾 settings.mainPanelNode (flat, sponsor-excluded) saved → ${vis}`);
        }
      } catch (e) {
        if (DEBUG_ENABLED) debugLog.warn('⚠️ Failed to persist mainPanelNode (flat)', e);
      }

      setContextState(sanitizedBase as ExchangeContextTypeOnly);
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
      (net as any).chainId = walletId as any;
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
      (net as any).chainId = undefined as any;
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
