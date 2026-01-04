// File: @/lib/context/ExchangeProvider.tsx
'use client';

import React, { createContext, useEffect, useRef, useState } from 'react';
import { useAccount, useChainId as useWagmiChainId } from 'wagmi';

import { initExchangeContext } from '@/lib/context/init/initExchangeContext';
import { useProviderSetters } from '@/lib/context/hooks/ExchangeContext/providers/useProviderSetters';
import { deriveNetworkFromApp } from '@/lib/context/helpers/NetworkHelpers';

import type {
  ExchangeContext as ExchangeContextTypeOnly,
  TRADE_DIRECTION,
  TokenContract,
  ErrorMessage,
  WalletAccount,
  NetworkElement,
} from '@/lib/structure';
import { SP_COIN_DISPLAY } from '@/lib/structure';

import type { PanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';
import { MUST_INCLUDE_ON_BOOT } from '@/lib/structure/exchangeContext/constants/defaultPanelTree';

import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { validateAndRepairPanels } from '@/lib/structure/exchangeContext/safety/validatePanelState';
import { createDebugLogger } from '@/lib/utils/debugLogger';

// ⬇️ wagmi readiness gate
import { useWagmiReady } from '@/lib/network/initialize/hooks/useWagmiReady';

// panel helpers + PanelBootstrap
import {
  PANEL_SCHEMA_VERSION,
  PanelBootstrap,
  repairPanels,
  dropNonPersisted,
  ensureRequiredPanels,
  reconcileOverlayVisibility,
  ensurePanelNamesInMemory,
  isMainPanels,
} from '@/lib/context/exchangeContext/helpers/panelBootstrap';

import { persistWithOptDiff } from '@/lib/context/exchangeContext/helpers/persistExchangeContext';

import { AppBootstrap } from '@/lib/context/init/AppBootstrap';

import { panelName } from '@/lib/context/exchangeContext/panelTree/panelTreePersistence';

// ✅ CHILDREN lets us derive a displayStack on cold boot (when LS is empty)
import { CHILDREN } from '@/lib/structure/exchangeContext/registry/panelRegistry';

// ✅ STACK gate: only these may appear in displayStack
import { IS_STACK_COMPONENT } from '@/lib/structure/exchangeContext/constants/spCoinDisplay';

/* ---------------------------- Debug logger toggle --------------------------- */
const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_PROVIDER === 'true';

const TRACE_DISPLAYSTACK =
  process.env.NEXT_PUBLIC_TRACE_BRANCHSTACK === 'true'; // kept env var name for compatibility

const debugLog = createDebugLogger('ExchangeProvider', DEBUG_ENABLED, LOG_TIME);

/* ---------------------------- Types & Context API --------------------------- */

export type ExchangeContextType = {
  exchangeContext: ExchangeContextTypeOnly;
  setExchangeContext: (
    updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly,
    hookName?: string,
  ) => void;

  setSellAmount: (amount: bigint) => void;
  setBuyAmount: (amount: bigint) => void;
  setSellBalance: (balance: bigint) => void;
  setBuyBalance: (balance: bigint) => void;
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

export const ExchangeContextState =
  createContext<ExchangeContextType | null>(null);

/* --------------------------------- Helpers -------------------------------- */

const ensureNetwork = (n?: Partial<NetworkElement>): NetworkElement => ({
  connected: !!n?.connected,
  appChainId: n?.appChainId ?? 0,
  chainId: typeof n?.chainId === 'number' ? (n!.chainId as number) : 0,
  logoURL: n?.logoURL ?? '',
  name: n?.name ?? '',
  symbol: n?.symbol ?? '',
  url: n?.url ?? '',
});

const clone = <T,>(o: T): T =>
  typeof structuredClone === 'function'
    ? structuredClone(o)
    : (JSON.parse(JSON.stringify(o)) as T);

/* ------------------------------ Trace helpers ------------------------------ */

const summarizeStacks = (settings: any) => {
  const ds = settings?.displayStack;
  return {
    displayStackType: Array.isArray(ds) ? 'array' : typeof ds,
    displayStackLen: Array.isArray(ds) ? ds.length : 0,
  };
};

/* ----------------------- DisplayStack hydration helpers ------------------- */

export type DISPLAY_STACK_NODE = {
  id: SP_COIN_DISPLAY; // authoritative
  name: string; // derived (non-authoritative)
};

const normalizeIdArray = (arr: unknown): SP_COIN_DISPLAY[] => {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x))
    .map((x) => x as SP_COIN_DISPLAY);
};

const normalizeDisplayStackNodes = (arr: unknown): DISPLAY_STACK_NODE[] => {
  if (!Array.isArray(arr)) return [];
  const out: DISPLAY_STACK_NODE[] = [];

  for (const it of arr as any[]) {
    // allow legacy numbers
    if (typeof it === 'number' || typeof it === 'string') {
      const id = Number(it);
      if (!Number.isFinite(id)) continue;
      out.push({ id: id as SP_COIN_DISPLAY, name: panelName(id as any) });
      continue;
    }

    if (!it || typeof it !== 'object') continue;
    const id = Number((it as any).id);
    if (!Number.isFinite(id)) continue;

    const name =
      typeof (it as any).name === 'string' && (it as any).name.trim().length
        ? String((it as any).name)
        : panelName(id as any);

    out.push({ id: id as SP_COIN_DISPLAY, name });
  }

  return out;
};

const idsFromNodes = (nodes: DISPLAY_STACK_NODE[]): SP_COIN_DISPLAY[] =>
  nodes
    .map((n) => Number(n.id))
    .filter((x) => Number.isFinite(x))
    .map((x) => x as SP_COIN_DISPLAY);

const toNodes = (ids: SP_COIN_DISPLAY[]): DISPLAY_STACK_NODE[] =>
  ids.map((id) => ({ id, name: panelName(Number(id) as any) }));

/**
 * ✅ STACK FILTER (boot-time):
 * displayStack must ONLY contain stack-eligible overlays (IS_STACK_COMPONENT).
 * This prevents non-stack panels like SELL_SELECT_PANEL from being persisted.
 */
const filterToStackComponents = (ids: SP_COIN_DISPLAY[]): SP_COIN_DISPLAY[] => {
  const out: SP_COIN_DISPLAY[] = [];
  const seen = new Set<number>();

  for (const id of ids) {
    const n = Number(id);
    if (!Number.isFinite(n)) continue;
    if (!IS_STACK_COMPONENT.has(n)) continue;
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(id);
  }

  return out;
};

/**
 * ✅ SINGLE SOURCE OF TRUTH:
 * - ONLY: ctx.settings.displayStack
 * - NEVER: ctx.displayStack (root)
 *
 * If legacy root exists and settings is empty, migrate once.
 * Then ALWAYS delete ctx.displayStack.
 */
const enforceSettingsDisplayStackOnly = (ctx: any) => {
  if (!ctx || typeof ctx !== 'object') return;

  ctx.settings = ctx.settings ?? {};

  const root = (ctx as any).displayStack;
  const settings = (ctx as any).settings?.displayStack;

  const settingsEmpty = !Array.isArray(settings) || settings.length === 0;
  const rootHas = Array.isArray(root) && root.length > 0;

  if (rootHas && settingsEmpty) {
    const migratedNodes = normalizeDisplayStackNodes(root);
    (ctx as any).settings.displayStack =
      migratedNodes.length > 0 ? migratedNodes : toNodes(normalizeIdArray(root));
  }

  if ('displayStack' in (ctx as any)) {
    delete (ctx as any).displayStack;
  }
};

const normalizeSettingsDisplayStack = (ctx: any) => {
  if (!ctx || typeof ctx !== 'object') return;
  ctx.settings = ctx.settings ?? {};

  const raw = ctx.settings.displayStack;
  const nodesFromDisplay = normalizeDisplayStackNodes(raw);
  const nodes =
    nodesFromDisplay.length > 0 ? nodesFromDisplay : toNodes(normalizeIdArray(raw));

  ctx.settings.displayStack = nodes;
};

/**
 * Cold-boot fallback:
 * Build displayStack from visible panels + CHILDREN hierarchy.
 *
 * NOTE: This returns a "visible path" which includes non-stack nodes.
 * We MUST filter it through IS_STACK_COMPONENT before persisting.
 */
const getChildren = (panel: SP_COIN_DISPLAY): SP_COIN_DISPLAY[] => {
  const maybe = (CHILDREN as unknown as Record<number, SP_COIN_DISPLAY[]>)[
    Number(panel)
  ];
  return Array.isArray(maybe) ? maybe : [];
};

const computeVisibleDisplayStackFromPanels = (
  flatPanels: Array<{ panel: number; visible: boolean }>,
  start: SP_COIN_DISPLAY,
): SP_COIN_DISPLAY[] => {
  const visibleMap: Record<number, boolean> = {};
  for (const n of flatPanels) visibleMap[Number(n.panel)] = !!n.visible;

  const seen = new Set<number>();
  const path: SP_COIN_DISPLAY[] = [];
  let current: SP_COIN_DISPLAY | null = start;

  while (current != null) {
    const id = Number(current);
    if (seen.has(id)) break;
    seen.add(id);

    path.push(current);

    const kids = getChildren(current);
    let selected: SP_COIN_DISPLAY | null = null;

    for (const k of kids) {
      if (visibleMap[Number(k)]) {
        selected = k;
        break;
      }
    }

    if (!selected) break;
    current = selected;
  }

  return path;
};

/* --------------------------------- Provider -------------------------------- */

export function ExchangeProvider({ children }: { children: React.ReactNode }) {
  const wagmiChainId = useWagmiChainId();
  const { address, isConnected } = useAccount();
  const wagmiReady = useWagmiReady();

  const [contextState, setContextState] = useState<
    ExchangeContextTypeOnly | undefined
  >(undefined);
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | undefined>();
  const [apiErrorMessage, setApiErrorMessage] = useState<
    ErrorMessage | undefined
  >();
  const hasInitializedRef = useRef(false);

  const setExchangeContext = (
    updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly,
    _hookName = 'unknown',
  ) => {
    setContextState((prev) => {
      if (!prev) return prev;

      if (TRACE_DISPLAYSTACK) {
        // eslint-disable-next-line no-console
        console.groupCollapsed(`[TRACE][setExchangeContext] hook=${_hookName}`);
        // eslint-disable-next-line no-console
        console.log(
          '[TRACE] prev.settings stack summary',
          summarizeStacks((prev as any).settings),
        );
      }

      const prevStr = stringifyBigInt(prev);

      const nextRaw = updater(prev);
      if (!nextRaw) return prev;

      const nextBase = clone(nextRaw);
      nextBase.settings = (nextBase as any).settings ?? {};

      // ✅ enforce single source of truth: settings.displayStack only
      enforceSettingsDisplayStackOnly(nextBase as any);
      normalizeSettingsDisplayStack(nextBase as any);

      if (TRACE_DISPLAYSTACK) {
        const s = (nextBase as any).settings;
        // eslint-disable-next-line no-console
        console.log('[TRACE] next.settings stack summary', summarizeStacks(s));
        // eslint-disable-next-line no-console
        console.log('[TRACE] next.settings.displayStack', s.displayStack);
      }

      const nextStr = stringifyBigInt(nextBase);
      if (prevStr === nextStr) {
        if (TRACE_DISPLAYSTACK) {
          // eslint-disable-next-line no-console
          console.log('[TRACE] no-op update (prevStr === nextStr)');
          // eslint-disable-next-line no-console
          console.groupEnd();
        }
        return prev;
      }

      // ✅ persist (also guaranteed: no root displayStack)
      const normalized = clone(nextBase);
      enforceSettingsDisplayStackOnly(normalized as any);
      normalizeSettingsDisplayStack(normalized as any);

      (normalized as any).settings = {
        ...(normalized as any).settings,
        spCoinPanelSchemaVersion: PANEL_SCHEMA_VERSION,
      };

      if (DEBUG_ENABLED) {
        // eslint-disable-next-line no-console
        console.log('[ExchangeProvider][persist]', {
          hook: _hookName,
          persistedDisplayStack: (normalized as any).settings.displayStack,
          persistedIds: idsFromNodes((normalized as any).settings.displayStack).map(
            Number,
          ),
        });
      }

      persistWithOptDiff(prev, normalized, 'ExchangeContext.settings');

      if (TRACE_DISPLAYSTACK) {
        // eslint-disable-next-line no-console
        console.groupEnd();
      }

      return nextBase;
    });
  };

  useEffect(() => {
    if (!wagmiReady) {
      debugLog.log?.(
        '[ExchangeProvider] wagmi not ready yet — skipping initExchangeContext boot',
      );
      return;
    }
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    (async () => {
      debugLog.log?.('🚀 initExchangeContext boot start', {
        wagmiChainId,
        isConnected,
        address,
      });

      const base = await initExchangeContext(wagmiChainId, isConnected, address);

      // ✅ enforce single source of truth immediately on boot result
      enforceSettingsDisplayStackOnly(base as any);

      const settingsAny = (base as any).settings ?? {};
      const storedPanels = settingsAny.spCoinPanelTree as PanelNode[] | undefined;

      const repaired = repairPanels(
        isMainPanels(storedPanels) ? storedPanels : undefined,
      );
      const { panels: validated } = validateAndRepairPanels(repaired);
      const ensured = ensureRequiredPanels(
        dropNonPersisted(validated),
        MUST_INCLUDE_ON_BOOT,
      );

      const flatPanels = reconcileOverlayVisibility(ensured);

      // --- read stored stack (if any) ---
      const storedNodes = normalizeDisplayStackNodes(settingsAny.displayStack);
      const storedIdsRaw =
        storedNodes.length > 0
          ? idsFromNodes(storedNodes)
          : normalizeIdArray(settingsAny.displayStack);

      // ✅ filter out non-stack ids like SELL_SELECT_PANEL
      const storedIds = filterToStackComponents(storedIdsRaw);

      // --- cold boot derive stack ---
      const derivedIdsRaw = computeVisibleDisplayStackFromPanels(
        flatPanels as any,
        SP_COIN_DISPLAY.MAIN_TRADING_PANEL,
      );

      // ✅ filter derived path down to overlays only
      const derivedIds = filterToStackComponents(derivedIdsRaw);

      const chosenIds = storedIds.length > 0 ? storedIds : derivedIds;
      const chosenNodes = toNodes(chosenIds);

      const nextSettings: any = {
        ...settingsAny,
        spCoinPanelTree: flatPanels.map((n: any) => ({
          panel: n.panel,
          name: n.name,
          visible: n.visible,
        })),
        displayStack: chosenNodes, // ✅ canonical + filtered
        spCoinPanelSchemaVersion: PANEL_SCHEMA_VERSION,
      };

      const net = ensureNetwork((base as any).network);
      (base as any).network = net;
      (base as any).settings = nextSettings;

      // ✅ guarantee no root displayStack before persisting / storing
      enforceSettingsDisplayStackOnly(base as any);
      normalizeSettingsDisplayStack(base as any);

      persistWithOptDiff(
        undefined,
        base as ExchangeContextTypeOnly,
        'ExchangeContext.settings',
      );

      (base as any).settings.spCoinPanelTree = ensurePanelNamesInMemory(flatPanels);

      // ✅ store in state without root displayStack
      enforceSettingsDisplayStackOnly(base as any);

      setContextState(base as ExchangeContextTypeOnly);
      debugLog.log?.('✅ initExchangeContext boot complete', {
        bootStoredStackRaw: storedIdsRaw.map(Number),
        bootDerivedPathRaw: derivedIdsRaw.map(Number),
        bootChosenStackFiltered: chosenIds.map(Number),
      });
    })();
  }, [wagmiReady, wagmiChainId, isConnected, address]);

  const {
    setRecipientAccount,
    setSellAmount,
    setBuyAmount,
    setSellBalance,
    setBuyBalance,
    setSellTokenContract,
    setBuyTokenContract,
    setTradeDirection,
    setSlippageBps,
    setAppChainId,
  } = useProviderSetters(setExchangeContext);

  const lastAppliedAddrRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!contextState) return;

    const nextAddr = isConnected ? (address ?? undefined) : undefined;

    if (!isConnected || !nextAddr) {
      debugLog.log?.(
        '[ExchangeProvider] disconnect or missing address — preserving previous accounts.activeAccount',
      );
      return;
    }

    if (
      lastAppliedAddrRef.current === nextAddr &&
      contextState.accounts?.activeAccount?.address === nextAddr
    ) {
      return;
    }

    setExchangeContext(
      (prev) => {
        const next = clone(prev);
        (next as any).accounts = (next as any).accounts ?? {};
        (next as any).accounts.activeAccount = {
          ...((next as any).accounts.activeAccount ?? {}),
          address: nextAddr,
        };
        return next;
      },
      'provider:syncActiveAccount',
    );

    lastAppliedAddrRef.current = nextAddr;
  }, [contextState, isConnected, address]);

  useEffect(() => {
    if (!contextState) return;
    if (isConnected && address && !contextState.accounts?.activeAccount?.address) {
      setExchangeContext(
        (prev) => {
          const next = clone(prev);
          (next as any).accounts = (next as any).accounts ?? {};
          (next as any).accounts.activeAccount = {
            ...((next as any).accounts.activeAccount ?? {}),
            address,
          };
          return next;
        },
        'provider:rehydrateRepairActiveAccount',
      );
      lastAppliedAddrRef.current = address;
    }
  }, [contextState, isConnected, address, setExchangeContext]);

  const prevAppChainIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const appId = contextState?.network?.appChainId;
    if (appId === undefined) return;

    if (prevAppChainIdRef.current === undefined) {
      prevAppChainIdRef.current = appId;
      return;
    }

    if (prevAppChainIdRef.current !== appId) {
      setExchangeContext(
        (prev) => {
          const next = clone(prev);
          const derived = deriveNetworkFromApp(appId, undefined as any);
          next.network = {
            ...next.network,
            appChainId: appId,
            chainId: appId,
            name: derived?.name ?? '',
            symbol: derived?.symbol ?? '',
            url: derived?.url ?? '',
            logoURL: `/assets/blockchains/${appId}/info/network.png`,
          };
          return next;
        },
        'provider:onAppChainChange-refreshDisplay',
      );

      setSellTokenContract(undefined);
      setBuyTokenContract(undefined);

      prevAppChainIdRef.current = appId;
    }
  }, [
    contextState?.network?.appChainId,
    setExchangeContext,
    setSellTokenContract,
    setBuyTokenContract,
  ]);

  useEffect(() => {
    const appId = contextState?.network?.appChainId ?? 0;
    if (!appId) return;
    const expected = `/assets/blockchains/${appId}/info/network.png`;

    if (contextState?.network?.logoURL !== expected) {
      setExchangeContext(
        (prev) => {
          const next = clone(prev);
          next.network = { ...next.network, logoURL: expected };
          return next;
        },
        'provider:normalizeLogoURL',
      );
    }
  }, [
    contextState?.network?.appChainId,
    contextState?.network?.logoURL,
    setExchangeContext,
  ]);

  if (!contextState) return null;

  // ✅ FINAL GUARD: never expose root displayStack to consumers
  const { displayStack: _rootDisplayStack, ...exchangeContextNoRoot } =
    (contextState as any) ?? {};
  (exchangeContextNoRoot as any).settings =
    (exchangeContextNoRoot as any).settings ?? {};
  enforceSettingsDisplayStackOnly(exchangeContextNoRoot as any);
  normalizeSettingsDisplayStack(exchangeContextNoRoot as any);

  return (
    <ExchangeContextState.Provider
      value={{
        exchangeContext: {
          ...(exchangeContextNoRoot as ExchangeContextTypeOnly),
          errorMessage,
          apiErrorMessage,
        } as ExchangeContextTypeOnly,
        setExchangeContext,
        setSellAmount,
        setBuyAmount,
        setSellBalance,
        setBuyBalance,
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
      <PanelBootstrap />
      <AppBootstrap />
      {children}
    </ExchangeContextState.Provider>
  );
}
