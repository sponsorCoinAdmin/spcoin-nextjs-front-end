// File: lib/context/ExchangeProvider.tsx
'use client';

import React, { createContext, useEffect, useRef, useState } from 'react';
import { useAccount, useChainId as useWagmiChainId } from 'wagmi';

import { initExchangeContext } from '@/lib/context/helpers/initExchangeContext';
import { useProviderSetters } from '@/lib/context/hooks/ExchangeContext/hooks/useProviderSetters';
import { deriveNetworkFromApp } from '@/lib/context/helpers/NetworkHelpers';
import { reconcilePanelState } from '@/lib/context/exchangeContext/helpers/panelReconcile';

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
  const { activeMainOverlay, openPanel } = usePanelTree();
  const did = useRef(false);

  useEffect(() => {
    if (did.current) return;
    did.current = true;

    // Only pick a default if nothing is selected (rare), so we never override a persisted choice
    if (activeMainOverlay == null) {
      queueMicrotask(() => openPanel(SP_COIN_DISPLAY.TRADING_STATION_PANEL));
    }
  }, [activeMainOverlay, openPanel]);

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
      } catch { }
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

      const radioTopLevel: any[] =
        (settingsAny.mainPanelNode as any[]) ?? []; // if you keep mainPanelNode persisted

      reconcilePanelState(
        flatPanels as any,
        radioTopLevel as any,
        SP_COIN_DISPLAY.TRADING_STATION_PANEL
      );

      // Persist both, now coherent
      const nextSettings: any = {
        ...settingsAny,
        spCoinPanelTree: normalizeForPersistence(flatPanels),
        mainPanelNode: radioTopLevel,              // <-- keep in sync
        spCoinPanelSchemaVersion: 3,               // bump schema to force migration
      };
      nextSettings['spCoinPanelSchemaVersion'] = PANEL_SCHEMA_VERSION;

      const net = ensureNetwork((base as any).network);
      net.connected = !!isConnected;
      net.chainId = isConnected && typeof wagmiChainId === 'number' ? (wagmiChainId as number) : 0;

      (base as any).network = net;
      (base as any).settings = nextSettings;

      try { saveLocalExchangeContext(base); } catch { }

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

  /* 🔐 Authoritative sync of connectedAccount from Wagmi */
  const lastAppliedAddrRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!contextState) return;

    const nextAddr = isConnected ? (address ?? undefined) : undefined;

    // no change
    if (lastAppliedAddrRef.current === nextAddr &&
        contextState.accounts?.connectedAccount?.address === nextAddr) {
      return;
    }

    setExchangeContext((prev) => {
      const next = clone(prev);
      (next as any).accounts = (next as any).accounts ?? {};
      if (nextAddr) {
        // normalize to checksum/lowercase if you prefer; here we keep as-provided
        (next as any).accounts.connectedAccount = {
          ...((next as any).accounts.connectedAccount ?? {}),
          address: nextAddr,
        };
      } else {
        (next as any).accounts.connectedAccount = undefined;
      }
      return next;
    }, 'provider:syncConnectedAccount');

    lastAppliedAddrRef.current = nextAddr;
  }, [contextState, isConnected, address, setExchangeContext]);

  // 🩹 Repair after rehydrate (in case storage clobbers a live connection)
  useEffect(() => {
    if (!contextState) return;
    if (isConnected && address && !contextState.accounts?.connectedAccount?.address) {
      setExchangeContext((prev) => {
        const next = clone(prev);
        (next as any).accounts = (next as any).accounts ?? {};
        (next as any).accounts.connectedAccount = {
          ...((next as any).accounts.connectedAccount ?? {}),
          address,
        };
        return next;
      }, 'provider:rehydrateRepairConnectedAccount');
      lastAppliedAddrRef.current = address;
    }
  }, [contextState, isConnected, address, setExchangeContext]);

  /** SINGLE source of truth on appChainId change:
   *  - Refresh display fields (name/symbol/url/logoURL) from registry + template
   *  - Clear chain-scoped contracts
   *  We detect the change with a ref so we aren't comparing inside the setter.
   */
  const prevAppChainIdRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    const appId = contextState?.network?.appChainId;
    if (appId === undefined) return;

    // On first hydrate just set the baseline; optionally normalize the logo (below).
    if (prevAppChainIdRef.current === undefined) {
      prevAppChainIdRef.current = appId;
      return;
    }

    if (prevAppChainIdRef.current !== appId) {
      // Update display fields atomically
      setExchangeContext((prev) => {
        const next = clone(prev);
        const derived = deriveNetworkFromApp(appId, undefined as any);
        next.network = {
          ...next.network,
          appChainId: appId,
          name: derived?.name ?? '',
          symbol: derived?.symbol ?? '',
          url: derived?.url ?? '',
          logoURL: `/assets/blockchains/${appId}/info/network.png`,
        };
        return next;
      }, 'provider:onAppChainChange-refreshDisplay');

      // Clear chain-scoped contracts
      setSellTokenContract(undefined);
      setBuyTokenContract(undefined);

      prevAppChainIdRef.current = appId;
    }
  }, [contextState?.network?.appChainId, setExchangeContext, setSellTokenContract, setBuyTokenContract]);

  /** Safety net: if logoURL ever drifts from the template for the current appId, fix it. */
  useEffect(() => {
    const appId = contextState?.network?.appChainId ?? 0;
    if (!appId) return;
    const expected = `/assets/blockchains/${appId}/info/network.png`;
    if (contextState?.network?.logoURL !== expected) {
      setExchangeContext((prev) => {
        const next = clone(prev);
        next.network = { ...next.network, logoURL: expected };
        return next;
      }, 'provider:normalizeLogoURL');
    }
  }, [contextState?.network?.appChainId, contextState?.network?.logoURL, setExchangeContext]);

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
