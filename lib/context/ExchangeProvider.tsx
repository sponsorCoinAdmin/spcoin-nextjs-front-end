// File: lib/context/ExchangeProvider.tsx
'use client';

import React, { createContext, useEffect, useRef, useState } from 'react';
import { useAccount, useChainId as useWagmiChainId } from 'wagmi';

import { saveLocalExchangeContext } from '@/lib/context/helpers/ExchangeSaveHelpers';
import { initExchangeContext } from '@/lib/context/helpers/initExchangeContext';
import { useProviderSetters } from '@/lib/context/providers/Exchange/useProviderSetters';
import { useProviderWatchers } from '@/lib/context/providers/Exchange/useProviderWatchers';
import { deriveNetworkFromApp } from '@/lib/context/helpers/NetworkHelpers';

import {
  ExchangeContext as ExchangeContextTypeOnly,
  TRADE_DIRECTION,
  TokenContract,
  ErrorMessage,
  WalletAccount,
  NetworkElement,
  SP_COIN_DISPLAY,
} from '@/lib/structure';

import { defaultMainPanels } from '@/lib/structure/exchangeContext/constants/defaultPanelTree';
import type { PanelNode, MainPanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';

import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

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

type PanelChildrenMap = Record<number, number[]>;

const ensureNetwork = (n?: Partial<NetworkElement>): NetworkElement => ({
  connected: !!n?.connected,
  appChainId: n?.appChainId ?? 0,
  chainId: (n?.chainId as any) ?? undefined,
  logoURL: n?.logoURL ?? '',
  name: n?.name ?? '',
  symbol: n?.symbol ?? '',
  url: n?.url ?? '',
});

const isLegacyMainPanelNode = (x: any): x is MainPanelNode =>
  !!x && typeof x === 'object' && typeof x.panel === 'number' && typeof x.visible === 'boolean' && Array.isArray(x.children);

// Accepts an array of panel nodes (children may or may not be present)
const isMainPanels = (x: any): x is PanelNode[] =>
  Array.isArray(x) &&
  x.every(
    (n) =>
      n &&
      typeof n === 'object' &&
      typeof (n as any).panel === 'number' &&
      typeof (n as any).visible === 'boolean'
  );

// Strip children from panel nodes (we keep relationships in settings.panelChildren only)
const ensurePanelName = (n: PanelNode): PanelNode => ({
  panel: n.panel,
  name: n.name || (SP_COIN_DISPLAY[n.panel] ?? String(n.panel)),
  visible: !!n.visible,
  children: [], // ← ensure no embedded children ever persist in mainPanelNode
});

const ensurePanelNamesFlat = (panels: PanelNode[]): PanelNode[] => panels.map(ensurePanelName);

// Flatten a legacy root+children into a flat list and strip children
const legacyTreeToFlatPanels = (root: MainPanelNode): PanelNode[] => {
  const flat: PanelNode[] = [];
  const push = (m: MainPanelNode) =>
    flat.push({
      panel: m.panel,
      name: m.name || (SP_COIN_DISPLAY[m.panel] ?? String(m.panel)),
      visible: m.visible,
      children: [], // ← legacy children are discarded here
    });
  push(root);
  for (const c of root.children || []) push(c as MainPanelNode);
  return flat;
};

// Minimal validator for a panel-children map
function isPanelChildrenMap(x: any): x is PanelChildrenMap {
  if (!x || typeof x !== 'object') return false;
  for (const k of Object.keys(x)) {
    const arr = (x as any)[k];
    if (!Array.isArray(arr) || !arr.every((n) => typeof n === 'number')) return false;
  }
  return true;
}

// Default relationships — empty by default (no seeding)
const DEFAULT_PANEL_CHILDREN: PanelChildrenMap = {};

/* --------------------------------- Provider -------------------------------- */

export function ExchangeProvider({ children }: { children: React.ReactNode }) {
  const wagmiChainId = useWagmiChainId();
  const { address, isConnected, status: accountStatus } = useAccount();

  const [contextState, setContextState] = useState<ExchangeContextTypeOnly | undefined>();
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | undefined>();
  const [apiErrorMessage, setApiErrorMessage] = useState<ErrorMessage | undefined>();
  const hasInitializedRef = useRef(false);

  // Persist + update state (no injection/stripping)
  const setExchangeContext = (
    updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly,
    _hookName = 'unknown'
  ) => {
    setContextState((prev) => {
      if (!prev) return prev;
      const nextBase = updater(prev);
      if (!nextBase) return prev;

      try {
        saveLocalExchangeContext(nextBase);
      } catch {
        /* ignore persist errors */
      }

      return stringifyBigInt(prev) === stringifyBigInt(nextBase) ? prev : nextBase;
    });
  };

  // Initial hydrate + normalize (mainPanelNode + panelChildren + ui.nonMainVisible)
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    (async () => {
      const base = await initExchangeContext(wagmiChainId, isConnected, address);
      const settingsAny = (base as any).settings ?? {};
      const storedPanels = settingsAny.mainPanelNode;

      // mainPanelNode (flat, children always stripped)
      let flatPanels: PanelNode[];
      if (isMainPanels(storedPanels)) flatPanels = ensurePanelNamesFlat(storedPanels);
      else if (isLegacyMainPanelNode(storedPanels)) flatPanels = ensurePanelNamesFlat(legacyTreeToFlatPanels(storedPanels));
      else flatPanels = ensurePanelNamesFlat(defaultMainPanels);

      // panelChildren (graph)
      const storedChildren = settingsAny.panelChildren;
      const panelChildren: PanelChildrenMap = isPanelChildrenMap(storedChildren)
        ? storedChildren
        : DEFAULT_PANEL_CHILDREN;

      // ui.nonMainVisible (ephemeral visibility for non-main panels)
      const ui = (settingsAny.ui ?? {}) as any;
      const nonMainVisible =
        ui && ui.nonMainVisible && typeof ui.nonMainVisible === 'object'
          ? ui.nonMainVisible
          : ({} as Record<number, boolean>);

      (base as any).settings = {
        ...settingsAny,
        mainPanelNode: flatPanels,
        panelChildren,
        ui: { ...ui, nonMainVisible },
      };

      try {
        saveLocalExchangeContext(base);
      } catch {
        /* ignore persist errors */
      }

      setContextState(base as ExchangeContextTypeOnly);
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

  // Single wallet/network sync effect (connected + chainId)
  useEffect(() => {
    if (!contextState) return;

    setExchangeContext((prev) => {
      const next = structuredClone(prev);
      const net = ensureNetwork(next.network);

      const connected = !!isConnected;
      const desiredChainId = connected && typeof wagmiChainId === 'number' ? wagmiChainId : undefined;

      const noChange =
        net.connected === connected &&
        ((typeof net.chainId === 'undefined' && typeof desiredChainId === 'undefined') ||
          net.chainId === desiredChainId);

      if (noChange) return prev;

      net.connected = connected;
      (net as any).chainId = desiredChainId as any;
      next.network = net;
      return next;
    }, 'provider:syncNetworkAndWallet');
  }, [isConnected, wagmiChainId, contextState, setExchangeContext]);

  // Hydrate name/symbol/logo/url from APP chain selection
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
