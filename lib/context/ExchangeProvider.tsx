// File: lib/context/ExchangeProvider.tsx
'use client';

import React, { createContext, useEffect, useRef, useState } from 'react';
import { useAccount, useChainId as useWagmiChainId } from 'wagmi';

import { initExchangeContext } from '@/lib/context/helpers/initExchangeContext';
import { useProviderSetters } from '@/lib/context/hooks/ExchangeContext/hooks/useProviderSetters';
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
import { MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/registry/panelRegistry';
import {
  defaultSpCoinPanelTree,
  flattenPanelTree,
  NON_PERSISTED_PANELS,
  MUST_INCLUDE_ON_BOOT,
} from '@/lib/structure/exchangeContext/constants/defaultPanelTree';

import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { saveLocalExchangeContext } from './helpers/ExchangeSaveHelpers';
import { validateAndRepairPanels } from '@/lib/structure/exchangeContext/safety/validatePanelState';

// post-mount only: open the default overlay safely
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

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

const PANEL_SCHEMA_VERSION = 2;

const ensureNetwork = (n?: Partial<NetworkElement>): NetworkElement => ({
  connected: !!n?.connected,
  appChainId: n?.appChainId ?? 0,
  chainId: typeof n?.chainId === 'number' ? (n!.chainId as number) : 0,
  logoURL: n?.logoURL ?? '',
  name: n?.name ?? '',
  symbol: n?.symbol ?? '',
  url: n?.url ?? '',
});

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
  children: Array.isArray(n.children) ? n.children.map(ensurePanelName) : undefined,
});

const ensurePanelNamesInMemory = (panels: PanelNode[]): PanelNode[] => panels.map(ensurePanelName);

const normalizeForPersistence = (panels: PanelNode[]): SpCoinPanelTree =>
  panels.map((n) => ({
    panel: n.panel,
    name: n.name || (SP_COIN_DISPLAY[n.panel] ?? String(n.panel)),
    visible: !!n.visible,
  }));

const clone = <T,>(o: T): T =>
  typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));

/** Start from authored defaults, merge persisted, enforce required and order. */
function repairPanels(persisted: Array<{ panel: number; name?: string; visible?: boolean }> | undefined): PanelNode[] {
  const defaults = flattenPanelTree(defaultSpCoinPanelTree).filter(
    (p) => !NON_PERSISTED_PANELS.has(p.panel as SP_COIN_DISPLAY)
  );

  const byId = new Map<number, PanelNode>();
  for (const p of defaults) {
    byId.set(p.panel, {
      panel: p.panel,
      name: p.name || (SP_COIN_DISPLAY[p.panel] ?? String(p.panel)),
      visible: !!p.visible,
    });
  }

  if (Array.isArray(persisted)) {
    for (const p of persisted) {
      const id = p?.panel;
      if (!Number.isFinite(id) || NON_PERSISTED_PANELS.has(id as SP_COIN_DISPLAY)) continue;
      const prev = byId.get(id);
      if (prev) {
        if (typeof p.visible === 'boolean') prev.visible = p.visible;
        if (p.name && p.name !== prev.name) prev.name = p.name;
      } else {
        byId.set(id, {
          panel: id,
          name: p.name || (SP_COIN_DISPLAY[id] ?? String(id)),
          visible: !!p.visible,
        });
      }
    }
  }

  for (const [id, vis] of MUST_INCLUDE_ON_BOOT) {
    if (!byId.has(id)) byId.set(id, { panel: id, name: SP_COIN_DISPLAY[id] ?? String(id), visible: vis });
  }

  const defaultOrder = defaults.map((d) => d.panel);
  const extras = [...byId.keys()].filter((id) => !defaultOrder.includes(id));
  const orderedIds = [...defaultOrder, ...extras];
  return orderedIds.map((id) => byId.get(id)!);
}

/** Drop non-persisted items (safety no-op if they’re already excluded). */
function dropNonPersisted(panels: PanelNode[]) {
  return panels.filter((p) => !NON_PERSISTED_PANELS.has(p.panel as SP_COIN_DISPLAY));
}

/** Ensure required panels exist; apply default visibility only when absent. */
function ensureRequiredPanels(
  panels: PanelNode[],
  required: ReadonlyArray<readonly [number, boolean]>
) {
  const byId = new Map(panels.map((p) => [p.panel, { ...p }]));
  for (const [id, vis] of required) {
    if (!byId.has(id)) byId.set(id, { panel: id, name: SP_COIN_DISPLAY[id] ?? String(id), visible: vis });
  }
  return [...byId.values()];
}

/** Zero/one visible overlay; prefer TRADING_STATION_PANEL if multiple. */
const reconcileOverlayVisibility = (flat: PanelNode[]): PanelNode[] => {
  const isOverlay = (id: number) => MAIN_OVERLAY_GROUP.includes(id as SP_COIN_DISPLAY);
  const visible = flat.filter((n) => isOverlay(n.panel) && n.visible);
  if (visible.length <= 1) return flat;
  const preferred =
    visible.find((n) => n.panel === SP_COIN_DISPLAY.TRADING_STATION_PANEL) ?? visible[0];
  return flat.map((n) => (isOverlay(n.panel) ? { ...n, visible: n.panel === preferred.panel } : n));
};

/* ----------------------- Post-mount bootstrap (safe) ------------------------ */

function PanelBootstrap() {
  const { openPanel } = usePanelTree();
  const did = useRef(false);
  useEffect(() => {
    if (did.current) return;
    did.current = true;
    queueMicrotask(() => openPanel(SP_COIN_DISPLAY.TRADING_STATION_PANEL));
  }, [openPanel]);
  return null;
}

/* --------------------------------- Provider -------------------------------- */

export function ExchangeProvider({ children }: { children: React.ReactNode }) {
  const wagmiChainId = useWagmiChainId();
  const { address, isConnected } = useAccount();

  const [contextState, setContextState] = useState<ExchangeContextTypeOnly | undefined>();
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | undefined>();
  const [apiErrorMessage, setApiErrorMessage] = useState<ErrorMessage | undefined>();
  const hasInitializedRef = useRef(false);

  const setExchangeContext = (
    updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly,
    _hookName = 'unknown'
  ) => {
    setContextState((prev) => {
      if (!prev) return prev;
      const nextBase = updater(prev);
      if (!nextBase) return prev;
      if (stringifyBigInt(prev) === stringifyBigInt(nextBase)) return prev;

      try {
        const normalized = clone(nextBase);
        if (Array.isArray((normalized as any)?.settings?.spCoinPanelTree)) {
          (normalized as any).settings.spCoinPanelTree = normalizeForPersistence(
            (normalized as any).settings.spCoinPanelTree as unknown as PanelNode[]
          );
        }
        (normalized as any).settings = { ...(normalized as any).settings };
        (normalized as any).settings['spCoinPanelSchemaVersion'] = PANEL_SCHEMA_VERSION;
        saveLocalExchangeContext(normalized);
      } catch {}
      return nextBase;
    });
  };

  // initial hydrate + normalize + migrate panels + immediate network reconcile
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    (async () => {
      const base = await initExchangeContext(wagmiChainId, isConnected, address);
      const settingsAny = (base as any).settings ?? {};
      const storedPanels = settingsAny.spCoinPanelTree as PanelNode[] | undefined;

      const repaired = repairPanels(isMainPanels(storedPanels) ? storedPanels : undefined);
      const { panels: validated } = validateAndRepairPanels(repaired.map(ensurePanelName));
      const ensured = ensureRequiredPanels(dropNonPersisted(validated), MUST_INCLUDE_ON_BOOT);
      const flatPanels = reconcileOverlayVisibility(ensured);

      const nextSettings: any = {
        ...settingsAny,
        spCoinPanelTree: normalizeForPersistence(flatPanels),
      };
      nextSettings['spCoinPanelSchemaVersion'] = PANEL_SCHEMA_VERSION;

      const net = ensureNetwork((base as any).network);
      net.connected = !!isConnected;
      net.chainId = isConnected && typeof wagmiChainId === 'number' ? (wagmiChainId as number) : 0;

      (base as any).network = net;
      (base as any).settings = nextSettings;

      try { saveLocalExchangeContext(base); } catch {}

      (base as any).settings.spCoinPanelTree = ensurePanelNamesInMemory(flatPanels);
      setContextState(base as ExchangeContextTypeOnly);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Wallet/network sync for subsequent changes
  useEffect(() => {
    if (!contextState) return;
    setExchangeContext((prev) => {
      const next = clone(prev);
      const net = ensureNetwork(next.network);
      const connected = !!isConnected;
      const desiredChainId =
        connected && typeof wagmiChainId === 'number' ? (wagmiChainId as number) : 0;
      if (net.connected === connected && net.chainId === desiredChainId) return prev;
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
      {/* Post-mount only; avoids any state/store updates during Provider render */}
      <PanelBootstrap />
      {children}
    </ExchangeContextState.Provider>
  );
}
