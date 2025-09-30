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

// NOTE: The constant is exported as `defaultMainPanelNode`; we alias it locally to keep your identifier.
import { defaultMainPanelNode as defaultMainPanels } from '@/lib/structure/exchangeContext/constants/defaultPanelTree';

import type {
  PanelNode,
  MainPanelNode,
  LegacyMainPanelRoot, // ⬅️ new legacy root type
} from '@/lib/structure/exchangeContext/types/PanelNode';

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

// Always return a *number* for chainId (0 == "unset")
const ensureNetwork = (n?: Partial<NetworkElement>): NetworkElement => ({
  connected: !!n?.connected,
  appChainId: n?.appChainId ?? 0,
  chainId: typeof n?.chainId === 'number' ? (n!.chainId as number) : 0,
  logoURL: n?.logoURL ?? '',
  name: n?.name ?? '',
  symbol: n?.symbol ?? '',
  url: n?.url ?? '',
});

// ✅ Properly detect the *legacy single-root object* shape
const isLegacyMainPanelRoot = (x: any): x is LegacyMainPanelRoot =>
  !!x &&
  typeof x === 'object' &&
  typeof x.panel === 'number' &&
  typeof x.visible === 'boolean' &&
  Array.isArray(x.children);

// Accept a flat array of panel nodes; children allowed and preserved (not persisted)
const isMainPanels = (x: any): x is PanelNode[] =>
  Array.isArray(x) &&
  x.every(
    (n) =>
      n &&
      typeof n === 'object' &&
      typeof (n as any).panel === 'number' &&
      typeof (n as any).visible === 'boolean' &&
      Array.isArray((n as any).children ?? [])
  );

// ✅ Preserve names recursively so UI/debug always have a label
const ensurePanelName = (n: PanelNode): PanelNode => ({
  panel: n.panel,
  name: n.name || (SP_COIN_DISPLAY[n.panel] ?? String(n.panel)),
  visible: !!n.visible,
  children: Array.isArray(n.children) ? n.children.map(ensurePanelName) : [],
});

const ensurePanelNamesPreserveChildren = (panels: PanelNode[]): PanelNode[] =>
  panels.map(ensurePanelName);

// Legacy: flatten root + children into a flat list for persistence
const legacyTreeToFlatPanels = (root: LegacyMainPanelRoot): PanelNode[] => {
  const flat: PanelNode[] = [];
  flat.push({
    panel: root.panel,
    name: root.name || (SP_COIN_DISPLAY[root.panel] ?? String(root.panel)),
    visible: root.visible,
    children: [], // strip legacy children from persistence
  });
  for (const c of root.children || []) {
    flat.push(ensurePanelName(c));
  }
  return flat;
};

const clone = <T,>(o: T): T =>
  typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));

/* --------------------------------- Provider -------------------------------- */

export function ExchangeProvider({ children }: { children: React.ReactNode }) {
  const wagmiChainId = useWagmiChainId();
  const { address, isConnected, status: accountStatus } = useAccount();

  const [contextState, setContextState] = useState<ExchangeContextTypeOnly | undefined>();
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | undefined>();
  const [apiErrorMessage, setApiErrorMessage] = useState<ErrorMessage | undefined>();
  const hasInitializedRef = useRef(false);

  // Persist + update (mirror to localStorage every change)
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

  // Initial hydrate + normalize (mainPanelNode only) + ⚡ immediate network reconcile
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    (async () => {
      const base = await initExchangeContext(wagmiChainId, isConnected, address);
      const settingsAny = (base as any).settings ?? {};
      const storedPanels = settingsAny.mainPanelNode;

      // Honor stored if valid; otherwise deep-copy defaults
      let flatPanels: PanelNode[];
      if (isMainPanels(storedPanels)) {
        flatPanels = ensurePanelNamesPreserveChildren(storedPanels);
      } else if (isLegacyMainPanelRoot(storedPanels)) {
        flatPanels = legacyTreeToFlatPanels(storedPanels);
      } else {
        flatPanels = ensurePanelNamesPreserveChildren(
          clone(defaultMainPanels as unknown as PanelNode[])
        );
      }

      // 🔧 Reconcile network against current Wagmi *before* persisting (kills the flicker)
      const net = ensureNetwork((base as any).network);
      net.connected = !!isConnected;
      net.chainId = isConnected && typeof wagmiChainId === 'number' ? (wagmiChainId as number) : 0; // 0 == unset
      (base as any).network = net;

      (base as any).settings = {
        ...settingsAny,
        mainPanelNode: flatPanels,
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

  // Pass wagmiChainId so watchers can log/compare transitions cleanly
  useProviderWatchers({
    contextState,
    setExchangeContext,
    appChainId,
    wagmiChainId,
    isConnected,
    address,
    accountStatus,
  });

  // Wallet/network sync for any subsequent changes
  useEffect(() => {
    if (!contextState) return;

    setExchangeContext((prev) => {
      const next = clone(prev);
      const net = ensureNetwork(next.network);

      const connected = !!isConnected;
      const desiredChainId =
        connected && typeof wagmiChainId === 'number' ? (wagmiChainId as number) : 0; // 0 == unset

      const noChange = net.connected === connected && net.chainId === desiredChainId;
      if (noChange) return prev;

      net.connected = connected;
      net.chainId = desiredChainId;
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
      const next = clone(prev);
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
        setSellAmount,
        setBuyAmount,
        setSellTokenContract,
        setBuyTokenContract,
        setTradeDirection,
        setSlippageBps,
        setRecipientAccount,
        setAppChainId,
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
