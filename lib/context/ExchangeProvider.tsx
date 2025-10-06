// File: lib/context/ExchangeProvider.tsx
'use client';

import React, { createContext, useEffect, useRef, useState } from 'react';
import { useAccount, useChainId as useWagmiChainId } from 'wagmi';

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

import type { PanelNode, SpCoinPanelTree } from '@/lib/structure/exchangeContext/types/PanelNode';
import { loadInitialPanelNodeDefaults } from '@/lib/structure/exchangeContext/defaults/loadInitialPanelNodeDefaults';
import { PANEL_DEFS, MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/registry/panelRegistry';

import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { saveLocalExchangeContext } from './helpers/ExchangeSaveHelpers';

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

// 🔁 Bump when we change panel persistence/migration behavior
const PANEL_SCHEMA_VERSION = 2;

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

// ✅ require NON-EMPTY array (empty means "seed defaults")
const isMainPanels = (x: any): x is PanelNode[] =>
  Array.isArray(x) &&
  x.length > 0 &&
  x.every(
    (n) =>
      n &&
      typeof n === 'object' &&
      typeof (n as any).panel === 'number' &&
      typeof (n as any).visible === 'boolean'
  );

const ensurePanelName = (n: PanelNode): PanelNode => ({
  panel: n.panel,
  name: n.name || (SP_COIN_DISPLAY[n.panel] ?? String(n.panel)),
  visible: !!n.visible,
  // keep any in-memory children if present, but we won't persist them
  children: Array.isArray(n.children) ? n.children.map(ensurePanelName) : undefined,
});

const ensurePanelNamesInMemory = (panels: PanelNode[]): PanelNode[] => panels.map(ensurePanelName);

// Normalize for persistence: strip children and ensure names → SpCoinPanelTree
const normalizeForPersistence = (panels: PanelNode[]): SpCoinPanelTree =>
  panels.map((n) => ({
    panel: n.panel,
    name: n.name || (SP_COIN_DISPLAY[n.panel] ?? String(n.panel)),
    visible: !!n.visible,
  }));

const clone = <T,>(o: T): T =>
  typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));

/** Append any panels defined in the registry missing from stored state. Idempotent. */
const ensureRegistryPanelsPresent = (flat: PanelNode[]): PanelNode[] => {
  const present = new Set(flat.map((n) => n.panel));
  const additions: PanelNode[] = PANEL_DEFS
    .filter((d) => !present.has(d.id))
    .map((d) => ({
      panel: d.id,
      name: SP_COIN_DISPLAY[d.id] ?? String(d.id),
      visible: !!d.defaultVisible,
    }));
  return additions.length ? [...flat, ...additions] : flat;
};

/** Ensure exactly zero-or-one overlays are visible; prefer TRADING_STATION_PANEL if multiple. */
const reconcileOverlayVisibility = (flat: PanelNode[]): PanelNode[] => {
  const isOverlay = (id: number) => MAIN_OVERLAY_GROUP.includes(id as SP_COIN_DISPLAY);
  const visible = flat.filter((n) => isOverlay(n.panel) && n.visible);
  if (visible.length <= 1) return flat;

  const preferred =
    visible.find((n) => n.panel === SP_COIN_DISPLAY.TRADING_STATION_PANEL) ?? visible[0];

  return flat.map((n) =>
    isOverlay(n.panel) ? { ...n, visible: n.panel === preferred.panel } : n
  );
};

/* --------------------------------- Provider -------------------------------- */

export function ExchangeProvider({ children }: { children: React.ReactNode }) {
  const wagmiChainId = useWagmiChainId();
  const { address, isConnected, status: accountStatus } = useAccount();

  const [contextState, setContextState] = useState<ExchangeContextTypeOnly | undefined>();
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | undefined>();
  const [apiErrorMessage, setApiErrorMessage] = useState<ErrorMessage | undefined>();
  const hasInitializedRef = useRef(false);

  // Persist + update (mirror to localStorage only when changed)
  const setExchangeContext = (
    updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly,
    _hookName = 'unknown'
  ) => {
    setContextState((prev) => {
      if (!prev) return prev;
      const nextBase = updater(prev);
      if (!nextBase) return prev;

      const changed = stringifyBigInt(prev) !== stringifyBigInt(nextBase);
      if (!changed) return prev;

      try {
        const normalized = clone(nextBase);

        // Always persist flat panel list
        if (Array.isArray(normalized?.settings?.spCoinPanelTree)) {
          normalized.settings.spCoinPanelTree = normalizeForPersistence(
            normalized.settings.spCoinPanelTree as unknown as PanelNode[]
          );
        }

        // NOTE: Avoid TS 2353 by assigning the version via bracket syntax on an any-typed object.
        (normalized as any).settings = {
          ...(normalized as any).settings,
          // do not add version here to avoid "excess property" check on object literal
        };
        (normalized as any).settings['spCoinPanelSchemaVersion'] = PANEL_SCHEMA_VERSION;

        saveLocalExchangeContext(normalized);
      } catch {
        /* ignore persist errors */
      }
      return nextBase;
    });
  };

  // Initial hydrate + normalize + migrate panels + immediate network reconcile
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    (async () => {
      const base = await initExchangeContext(wagmiChainId, isConnected, address);
      const settingsAny = (base as any).settings ?? {};
      const storedPanels = settingsAny.spCoinPanelTree;

      let flatPanels: PanelNode[];

      if (isMainPanels(storedPanels)) {
        // Take stored panels, then migrate to current behavior
        let next = storedPanels.map(ensurePanelName);
        next = ensureRegistryPanelsPresent(next);
        next = reconcileOverlayVisibility(next);
        flatPanels = next;
      } else {
        // Seed from defaults (flat, no children) then reconcile overlays
        const seed = loadInitialPanelNodeDefaults();
        flatPanels = reconcileOverlayVisibility(
          ensurePanelNamesInMemory(clone(seed as unknown as PanelNode[]))
        );
      }

      // Build settings object without the version first…
      const nextSettings: any = {
        ...settingsAny,
        spCoinPanelTree: normalizeForPersistence(flatPanels),
      };
      // …then assign version after to avoid TS "excess property" check.
      nextSettings['spCoinPanelSchemaVersion'] = PANEL_SCHEMA_VERSION;

      // Reconcile network against current Wagmi (prevents initial flicker)
      const net = ensureNetwork((base as any).network);
      net.connected = !!isConnected;
      net.chainId = isConnected && typeof wagmiChainId === 'number' ? (wagmiChainId as number) : 0;

      (base as any).network = net;
      (base as any).settings = nextSettings;

      try {
        saveLocalExchangeContext(base);
      } catch {
        /* ignore persist errors */
      }

      // Keep in-memory copy with names for runtime usage
      (base as any).settings.spCoinPanelTree = flatPanels;
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

  // Watchers (wallet/network + appChain hydration)
  useProviderWatchers({
    contextState,
    setExchangeContext,
    appChainId,
    wagmiChainId,
    isConnected,
    address,
    accountStatus,
  });

  // Wallet/network sync for subsequent changes
  useEffect(() => {
    if (!contextState) return;

    setExchangeContext((prev) => {
      const next = clone(prev);
      const net = ensureNetwork(next.network);

      const connected = !!isConnected;
      const desiredChainId =
        connected && typeof wagmiChainId === 'number' ? (wagmiChainId as number) : 0;

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
