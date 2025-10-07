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
import { defaultSpCoinPanelTree } from '@/lib/structure/exchangeContext/constants/defaultPanelTree'; // 👈 keep

import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { saveLocalExchangeContext } from './helpers/ExchangeSaveHelpers';
import { validateAndRepairPanels } from '@/lib/structure/exchangeContext/safety/validatePanelState';

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

// single warning gate for Phase 8 repairs
let _panelRepairWarned = false;

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

/** ─────────────────────── NEW canonical defaults/repair ────────────────────── **/

type FlatPanel = { panel: number; name?: string; visible?: boolean };
type DefaultsNode = { panel: number; name?: string; visible?: boolean; children?: DefaultsNode[] };

// Flatten authored default tree exactly as written (includes widgets)
function flattenDefaults(nodes: DefaultsNode[]): FlatPanel[] {
  const out: FlatPanel[] = [];
  const walk = (arr: DefaultsNode[]) => {
    for (const n of arr) {
      out.push({ panel: n.panel, name: n.name, visible: !!n.visible });
      if (n.children?.length) walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

// Panels that must **not** be persisted/seeded
const NON_PERSISTED = new Set<number>([SP_COIN_DISPLAY.SPONSOR_SELECT_PANEL_LIST]);

// Panels expected on cold boot and their required default visibility
const MUST_INCLUDE_ON_BOOT: Array<[number, boolean]> = [
  [SP_COIN_DISPLAY.MAIN_TRADING_PANEL, true],
  [SP_COIN_DISPLAY.TRADE_CONTAINER_HEADER, true],
  [SP_COIN_DISPLAY.TRADING_STATION_PANEL, true],
  [SP_COIN_DISPLAY.SELL_SELECT_PANEL, true],
  [SP_COIN_DISPLAY.BUY_SELECT_PANEL, true],
  // widgets:
  [SP_COIN_DISPLAY.SWAP_ARROW_BUTTON, true],
  [SP_COIN_DISPLAY.PRICE_BUTTON, true],
  [SP_COIN_DISPLAY.FEE_DISCLOSURE, true],
  // track but default-off:
  [SP_COIN_DISPLAY.AFFILIATE_FEE, false],
];

/**
 * Canonical panel repair:
 * - Start from authored defaults (widgets included)
 * - Exclude NON_PERSISTED panels
 * - Merge persisted visibility where present
 * - Stable, dup-free order (defaults first)
 */
function repairPanels(
  persisted: FlatPanel[] | undefined
): { panels: PanelNode[]; notes: string[] } {
  const notes: string[] = [];

  const defaults = flattenDefaults(defaultSpCoinPanelTree).filter(
    (p) => !NON_PERSISTED.has(p.panel)
  );

  // Seed map from defaults
  const byId = new Map<number, PanelNode>();
  for (const p of defaults) {
    byId.set(p.panel, {
      panel: p.panel,
      name: p.name || (SP_COIN_DISPLAY[p.panel] ?? String(p.panel)),
      visible: !!p.visible,
    });
  }

  // Merge persisted (preserve users' visibility; drop transient)
  if (Array.isArray(persisted)) {
    for (const p of persisted) {
      const id = p?.panel;
      if (!Number.isFinite(id)) continue;
      if (NON_PERSISTED.has(id)) {
        notes.push(`Removed non-persisted panel ${SP_COIN_DISPLAY[id] ?? id}`);
        continue;
      }
      const prev = byId.get(id);
      if (prev) {
        if (typeof p.visible === 'boolean' && p.visible !== prev.visible) {
          prev.visible = p.visible;
          notes.push(`Preserved visibility for ${SP_COIN_DISPLAY[id] ?? id}`);
        }
        if (p.name && p.name !== prev.name) prev.name = p.name;
      } else {
        // unknown/custom panel — keep it
        byId.set(id, {
          panel: id,
          name: p.name || (SP_COIN_DISPLAY[id] ?? String(id)),
          visible: !!p.visible,
        });
        notes.push(`Added custom/persisted panel ${SP_COIN_DISPLAY[id] ?? id}`);
      }
    }
  }

  // Ensure required panels exist with required vis (unless persisted already set)
  for (const [id, vis] of MUST_INCLUDE_ON_BOOT) {
    const r = byId.get(id);
    if (!r) {
      byId.set(id, { panel: id, name: SP_COIN_DISPLAY[id] ?? String(id), visible: vis });
      notes.push(`Added missing required panel ${SP_COIN_DISPLAY[id] ?? id}`);
    } else if (typeof r.visible !== 'boolean') {
      r.visible = vis;
    }
  }

  // Stable order: defaults first, then extras (unknown/custom)
  const defaultOrder = defaults.map((d) => d.panel);
  const extras = [...byId.keys()].filter((id) => !defaultOrder.includes(id));
  const orderedIds = [...defaultOrder, ...extras];

  return { panels: orderedIds.map((id) => byId.get(id)!), notes };
}

/** NEW: ensure a set of required panels exist (apply vis only when absent) */
function ensureRequiredPanels(panels: PanelNode[], required: Array<[number, boolean]>): {
  panels: PanelNode[];
  added: string[];
} {
  const byId = new Map(panels.map(p => [p.panel, { ...p }]));
  const added: string[] = [];
  for (const [id, vis] of required) {
    if (!byId.has(id)) {
      byId.set(id, {
        panel: id,
        name: SP_COIN_DISPLAY[id] ?? String(id),
        visible: vis,
      });
      added.push(SP_COIN_DISPLAY[id] ?? String(id));
    }
  }
  return { panels: [...byId.values()], added };
}

/** NEW: drop non-persisted panels (e.g., SPONSOR_SELECT_PANEL_LIST) */
function dropNonPersisted(panels: PanelNode[]): { panels: PanelNode[]; dropped: string[] } {
  const kept: PanelNode[] = [];
  const dropped: string[] = [];
  for (const p of panels) {
    if (NON_PERSISTED.has(p.panel)) {
      dropped.push(SP_COIN_DISPLAY[p.panel] ?? String(p.panel));
    } else {
      kept.push(p);
    }
  }
  return { panels: kept, dropped };
}

/** Ensure exactly zero-or-one overlays are visible; prefer TRADING_STATION_PANEL if multiple. */
const reconcileOverlayVisibility = (flat: PanelNode[]): PanelNode[] => {
  const isOverlay = (id: number) => MAIN_OVERLAY_GROUP.includes(id as SP_COIN_DISPLAY);
  const visible = flat.filter((n) => isOverlay(n.panel) && n.visible);
  if (visible.length <= 1) return flat;

  const preferred =
    visible.find((n) => n.panel === SP_COIN_DISPLAY.TRADING_STATION_PANEL) ?? visible[0];

  return flat.map((n) => (isOverlay(n.panel) ? { ...n, visible: n.panel === preferred.panel } : n));
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
        if (Array.isArray((normalized as any)?.settings?.spCoinPanelTree)) {
          (normalized as any).settings.spCoinPanelTree = normalizeForPersistence(
            (normalized as any).settings.spCoinPanelTree as unknown as PanelNode[]
          );
        }

        // Assign version without tripping TS excess-property checks
        (normalized as any).settings = {
          ...(normalized as any).settings,
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
      const storedPanels = settingsAny.spCoinPanelTree as PanelNode[] | undefined;

      // 1) Canonical repair starting from *authored defaults* (includes widgets)
      const { panels: repairedFromPersist, notes } = repairPanels(
        isMainPanels(storedPanels) ? storedPanels : undefined
      );

      // 2) Phase-8 safety validation still runs (idempotent)
      const { panels: validatedPanels, repaired: didRepair, reasons } = validateAndRepairPanels(
        repairedFromPersist.map(ensurePanelName)
      );

      // 3) Post-validator enforcement:
      //    3a) Drop any non-persisted panels validator may have added
      const { panels: noTransient, dropped } = dropNonPersisted(validatedPanels);

      //    3b) Re-ensure required defaults in case validator removed unknown IDs (widgets)
      const { panels: ensured, added } = ensureRequiredPanels(noTransient, MUST_INCLUDE_ON_BOOT);

      //    3c) Reconcile overlays LAST
      const flatPanels = reconcileOverlayVisibility(ensured);

      // 4) One-time warning line (kept for your previous log watchers)
      const combinedReasons = [
        ...notes,
        ...(didRepair ? reasons : []),
        ...(dropped.length ? [`Removed non-persisted: ${dropped.join(', ')}`] : []),
        ...(added.length ? [`Re-added required defaults: ${added.join(', ')}`] : []),
      ];
      if (combinedReasons.length && !_panelRepairWarned) {
        // eslint-disable-next-line no-console
        console.warn('[PanelState] Repaired persisted panel state:', combinedReasons);
        _panelRepairWarned = true;
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
      (base as any).settings.spCoinPanelTree = ensurePanelNamesInMemory(flatPanels);
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
