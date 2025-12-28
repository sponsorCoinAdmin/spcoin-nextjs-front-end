// File: @/lib/context/ExchangeProvider.tsx
'use client';

import React, { createContext, useEffect, useRef, useState } from 'react';
import { useAccount, useChainId as useWagmiChainId } from 'wagmi';

import { initExchangeContext } from '@/lib/context/init/initExchangeContext';
import { useProviderSetters } from '@/lib/context/hooks/ExchangeContext/providers/useProviderSetters';
import { deriveNetworkFromApp } from '@/lib/context/helpers/NetworkHelpers';
import { reconcilePanelState } from '@/lib/context/exchangeContext/helpers/panelReconcile';

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

// ✅ Need CHILDREN to derive display branch stack during hydration
import { CHILDREN } from '@/lib/structure/exchangeContext/registry/panelRegistry';

/* ---------------------------- Debug logger toggle --------------------------- */
const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_PROVIDER === 'true';

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

/* ----------------------- Panel stack hydration helpers --------------------- */

const normalizePanelTypeIdStack = (arr: unknown): SP_COIN_DISPLAY[] => {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x))
    .map((x) => x as SP_COIN_DISPLAY);
};

const samePanelStack = (a: SP_COIN_DISPLAY[], b: SP_COIN_DISPLAY[]) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (Number(a[i]) !== Number(b[i])) return false;
  return true;
};

const getChildren = (panel: SP_COIN_DISPLAY): SP_COIN_DISPLAY[] => {
  const maybe = (CHILDREN as unknown as Record<number, SP_COIN_DISPLAY[]>)[Number(panel)];
  return Array.isArray(maybe) ? maybe : [];
};

// Wrapper nodes you want to SKIP in the user-facing nav stack
const NON_INDEXED = new Set<number>([
  Number(SP_COIN_DISPLAY.MAIN_TRADING_PANEL),
  Number(SP_COIN_DISPLAY.TRADE_CONTAINER_HEADER),
  Number(SP_COIN_DISPLAY.CONFIG_SLIPPAGE_PANEL),
]);

const computeVisibleDisplayBranchFromPanels = (
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

    const kids: SP_COIN_DISPLAY[] = getChildren(current);

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

// ✅ Build the persisted nav stack by skipping wrapper nodes (e.g. 28)
const toPersistedNavStack = (displayBranch: SP_COIN_DISPLAY[]): SP_COIN_DISPLAY[] =>
  displayBranch.filter((p) => !NON_INDEXED.has(Number(p)));

// ✅ Repair structural visibility: if a descendant is visible, force container visible
const ensureStructuralContainersVisible = (
  flatPanels: Array<{ panel: number; visible: boolean; name?: string }>,
) => {
  const byId = new Map<number, { panel: number; visible: boolean; name?: string }>();
  for (const n of flatPanels) byId.set(Number(n.panel), n);

  const setVisible = (id: SP_COIN_DISPLAY) => {
    const key = Number(id);
    const node = byId.get(key);
    if (!node) return;
    if (!node.visible) node.visible = true;
  };

  // If MANAGE_SPONSORSHIPS is visible, TRADE_CONTAINER_HEADER must be visible
  const manage = byId.get(Number(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS));
  if (manage?.visible) {
    setVisible(SP_COIN_DISPLAY.TRADE_CONTAINER_HEADER);
    setVisible(SP_COIN_DISPLAY.MAIN_TRADING_PANEL);
  }

  // If TRADE_CONTAINER_HEADER is visible, MAIN_TRADING_PANEL must be visible
  const header = byId.get(Number(SP_COIN_DISPLAY.TRADE_CONTAINER_HEADER));
  if (header?.visible) {
    setVisible(SP_COIN_DISPLAY.MAIN_TRADING_PANEL);
  }

  return flatPanels;
};

/* --------------------------------- Provider -------------------------------- */

export function ExchangeProvider({ children }: { children: React.ReactNode }) {
  const wagmiChainId = useWagmiChainId();
  const { address, isConnected } = useAccount();
  const wagmiReady = useWagmiReady();

  const [contextState, setContextState] = useState<ExchangeContextTypeOnly | undefined>(
    undefined,
  );
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | undefined>();
  const [apiErrorMessage, setApiErrorMessage] = useState<ErrorMessage | undefined>();
  const hasInitializedRef = useRef(false);

  const setExchangeContext = (
    updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly,
    _hookName = 'unknown',
  ) => {
    setContextState((prev) => {
      if (!prev) return prev;

      const prevStr = stringifyBigInt(prev);

      const nextRaw = updater(prev);
      if (!nextRaw) return prev;

      // ✅ Keep LIVE state normalized (so devtools shows settings.panelTypeIdStack)
      const nextBase = clone(nextRaw);
      (nextBase as any).settings = (nextBase as any).settings ?? {};
      (nextBase as any).settings.panelTypeIdStack = normalizePanelTypeIdStack(
        (nextBase as any).settings.panelTypeIdStack,
      );

      const nextStr = stringifyBigInt(nextBase);
      if (prevStr === nextStr) return prev;

      const normalized = clone(nextBase);

      const st = normalizePanelTypeIdStack((normalized as any)?.settings?.panelTypeIdStack);

      (normalized as any).settings = {
        ...(normalized as any).settings,
        panelTypeIdStack: st,
        spCoinPanelSchemaVersion: PANEL_SCHEMA_VERSION,
      };

      if (DEBUG_ENABLED) {
        // eslint-disable-next-line no-console
        console.log('[ExchangeProvider][persistWithOptDiff]', {
          hook: _hookName,
          panelTypeIdStack: (normalized as any).settings.panelTypeIdStack,
          keys: Object.keys((normalized as any).settings ?? {}),
        });
      }

      persistWithOptDiff(prev, normalized, 'ExchangeContext.settings');

      return nextBase;
    });
  };

  useEffect(() => {
    if (!wagmiReady) {
      debugLog.log?.('[ExchangeProvider] wagmi not ready yet — skipping initExchangeContext boot');
      return;
    }
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    (async () => {
      debugLog.log?.('🚀 initExchangeContext boot start', { wagmiChainId, isConnected, address });

      const base = await initExchangeContext(wagmiChainId, isConnected, address);
      const settingsAny = (base as any).settings ?? {};
      const storedPanels = settingsAny.spCoinPanelTree as PanelNode[] | undefined;

      const repaired = repairPanels(isMainPanels(storedPanels) ? storedPanels : undefined);
      const { panels: validated } = validateAndRepairPanels(repaired);
      const ensured = ensureRequiredPanels(dropNonPersisted(validated), MUST_INCLUDE_ON_BOOT);

      // overlays reconciliation first
      let flatPanels = reconcileOverlayVisibility(ensured);

      // ✅ FIX A: repair structural container visibility (e.g. 28)
      flatPanels = ensureStructuralContainersVisible(flatPanels as any);

      const radioTopLevel: any[] = (settingsAny.mainPanelNode as any[]) ?? [];

      reconcilePanelState(flatPanels as any, radioTopLevel as any, SP_COIN_DISPLAY.TRADING_STATION_PANEL);

      // Rebuild display branch from visibility
      const displayBranch = computeVisibleDisplayBranchFromPanels(
        flatPanels as any,
        SP_COIN_DISPLAY.MAIN_TRADING_PANEL,
      );

      // ✅ FIX B: persisted nav stack skips wrapper nodes (so you get 12 -> 20 -> 6)
      const derivedStack = toPersistedNavStack(displayBranch);

      const storedStack = normalizePanelTypeIdStack(settingsAny.panelTypeIdStack);

      // If stored stack missing, or differs from derived, prefer derived on boot
      const panelTypeIdStack =
        storedStack.length === 0 || !samePanelStack(storedStack, derivedStack)
          ? derivedStack
          : storedStack;

      if (DEBUG_ENABLED) {
        // eslint-disable-next-line no-console
        console.log('[ExchangeProvider][boot] stack rebuild', {
          displayBranch: displayBranch.map(Number),
          derivedStack: derivedStack.map(Number),
          storedStack: storedStack.map(Number),
          chosenStack: panelTypeIdStack.map(Number),
          tradeHeaderVisible: !!(flatPanels as any).find((p: any) => Number(p.panel) === 28)?.visible,
          manageVisible: !!(flatPanels as any).find((p: any) => Number(p.panel) === 20)?.visible,
        });
      }

      const nextSettings: any = {
        ...settingsAny,
        spCoinPanelTree: flatPanels.map((n: any) => ({
          panel: n.panel,
          name: n.name,
          visible: n.visible,
        })),
        panelTypeIdStack,
        mainPanelNode: radioTopLevel,
        spCoinPanelSchemaVersion: PANEL_SCHEMA_VERSION,
      };

      const net = ensureNetwork((base as any).network);
      debugLog.log?.('[ExchangeProvider] network after initExchangeContext', { net });

      (base as any).network = net;
      (base as any).settings = nextSettings;

      // Persist on boot
      persistWithOptDiff(undefined, base as ExchangeContextTypeOnly, 'ExchangeContext.settings');

      // In-memory panel tree keeps full names
      (base as any).settings.spCoinPanelTree = ensurePanelNamesInMemory(flatPanels);

      setContextState(base as ExchangeContextTypeOnly);
      debugLog.log?.('✅ initExchangeContext boot complete');
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
  }, [contextState, isConnected, address, setExchangeContext]);

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
