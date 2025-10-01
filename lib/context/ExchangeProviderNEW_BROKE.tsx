// File: lib/context/ExchangeProvider.tsx
'use client';

import React, { createContext, useEffect, useRef, useState } from 'react';
import { useAccount, useChainId as useWagmiChainId } from 'wagmi';

import { saveLocalExchangeContext } from '@/lib/context/ExchangeSaveHelpers';
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

import type { PanelNode, MainPanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';

import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { loadInitialPanelNodeDefaults } from '../structure/exchangeContext/defaults/loadInitialPanelNodeDefaults';

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

const log = (...args: any[]) => console.log('[ExchangeProvider]', ...args);
const warn = (...args: any[]) => console.warn('[ExchangeProvider]', ...args);
const error = (...args: any[]) => console.error('[ExchangeProvider]', ...args);

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

// Flat-array guard (children may exist in-memory but are not persisted)
// ✅ Important: require NON-EMPTY array, otherwise we’ll seed defaults
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

// Ensure each node has a stable name; keep structure in memory
const ensurePanelName = (n: PanelNode): PanelNode => ({
  panel: n.panel,
  name: n.name || (SP_COIN_DISPLAY[n.panel] ?? String(n.panel)),
  visible: !!n.visible,
  // keep any in-memory children if present, but we won't persist them
  children: Array.isArray(n.children) ? n.children.map(ensurePanelName) : undefined,
});

// Normalize an array for use in memory (names ensured; children allowed in memory)
const ensurePanelNamesInMemory = (panels: PanelNode[]): PanelNode[] => panels.map(ensurePanelName);

// Normalize for persistence: strip children and ensure names → MainPanelNode
const normalizeForPersistence = (panels: PanelNode[]): MainPanelNode =>
  panels.map((n) => ({
    panel: n.panel,
    name: n.name || (SP_COIN_DISPLAY[n.panel] ?? String(n.panel)),
    visible: !!n.visible,
    // children intentionally omitted (flat persistence)
  }));

const clone = <T,>(o: T): T =>
  typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));

const samplePanels = (arr: PanelNode[] | undefined, limit = 6) =>
  Array.isArray(arr)
    ? arr.slice(0, limit).map((n) => ({
        panel: n.panel,
        name: n.name,
        visible: n.visible,
      }))
    : arr;

/* --------------------------------- Provider -------------------------------- */

export function ExchangeProvider({ children }: { children: React.ReactNode }) {
  const wagmiChainId = useWagmiChainId();
  const { address, isConnected, status: accountStatus } = useAccount();

  const [contextState, setContextState] = useState<ExchangeContextTypeOnly | undefined>();
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | undefined>();
  const [apiErrorMessage, setApiErrorMessage] = useState<ErrorMessage | undefined>();
  const hasInitializedRef = useRef(false);

  // Persist + update (mirror to localStorage on change)
  const setExchangeContext = (
    updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly,
    hookName = 'unknown'
  ) => {
    setContextState((prev) => {
      if (!prev) {
        warn('setExchangeContext called before init — ignoring. hook:', hookName);
        return prev;
      }
      const nextBase = updater(prev);
      if (!nextBase) {
        warn('Updater returned falsy; keeping previous state. hook:', hookName);
        return prev;
      }

      // ⬇️ Compare first; persist only when changed
      const changed = stringifyBigInt(prev) !== stringifyBigInt(nextBase);
      if (!changed) {
        log('no state change after updater (hook:', hookName, ')');
        return prev;
      }

      try {
        const normalized = clone(nextBase);
        if (Array.isArray(normalized?.settings?.mainPanelNode)) {
          normalized.settings.mainPanelNode = normalizeForPersistence(
            normalized.settings.mainPanelNode as unknown as PanelNode[]
          );
        }
        saveLocalExchangeContext(normalized);
        log(
          'persisted state (hook:',
          hookName,
          ') mainPanelNode size =',
          Array.isArray(normalized?.settings?.mainPanelNode)
            ? normalized.settings.mainPanelNode.length
            : 'N/A'
        );
      } catch (e) {
        error('persist failed (hook:', hookName, ')', e);
      }

      log('state updated (hook:', hookName, ')');
      return nextBase;
    });
  };

  // Initial hydrate + normalize (mainPanelNode only) + ⚡ immediate network reconcile
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    (async () => {
      log('init start', {
        wagmiChainId,
        isConnected,
        address,
      });

      let base: any;
      try {
        base = await initExchangeContext(wagmiChainId, isConnected, address);
      } catch (e) {
        error('initExchangeContext threw', e);
        base = {};
      }

      const settingsAny = (base as any).settings ?? {};
      const storedPanels = settingsAny.mainPanelNode;

      log('post-init: storedPanels shape', {
        isArray: Array.isArray(storedPanels),
        length: Array.isArray(storedPanels) ? storedPanels.length : undefined,
        passesGuard: isMainPanels(storedPanels),
        sample: samplePanels(storedPanels as any),
      });

      // Accept only NON-EMPTY FLAT arrays; otherwise fall back to defaults
      let flatPanels: PanelNode[];
      if (isMainPanels(storedPanels)) {
        flatPanels = ensurePanelNamesInMemory(storedPanels);
        log('using stored panels', {
          count: flatPanels.length,
          sample: samplePanels(flatPanels),
        });
      } else {
        const seeded = loadInitialPanelNodeDefaults();
        flatPanels = ensurePanelNamesInMemory(clone(seeded as unknown as PanelNode[]));
        log('seeding defaults (no/empty storedPanels)', {
          count: flatPanels.length,
          visibleTrue: flatPanels.filter((p) => p.visible).map((p) => p.name),
          sample: samplePanels(flatPanels),
        });
      }

      // 🔧 Reconcile network against current Wagmi *before* persisting (kills the flicker)
      const net = ensureNetwork((base as any).network);
      net.connected = !!isConnected;
      net.chainId = isConnected && typeof wagmiChainId === 'number' ? (wagmiChainId as number) : 0; // 0 == unset
      (base as any).network = net;

      // Persist FLAT panels (strip children) but keep in-memory array with names (children allowed in memory)
      (base as any).settings = {
        ...settingsAny,
        mainPanelNode: normalizeForPersistence(flatPanels),
      };

      try {
        saveLocalExchangeContext(base);
        log('persisted initial state', {
          persistedCount: (base as any).settings?.mainPanelNode?.length,
        });
      } catch (e) {
        error('persist initial state failed', e);
      }

      // Keep in-memory version with ensured names; children (if any) can exist only in memory
      (base as any).settings.mainPanelNode = flatPanels;
      log('in-memory state prepared', {
        inMemoryCount: (base as any).settings?.mainPanelNode?.length,
        visibleTrue: flatPanels.filter((p) => p.visible).map((p) => p.name),
      });

      setContextState(base as ExchangeContextTypeOnly);
      log('context initialized');
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
      if (noChange) {
        log('network sync: no change');
        return prev;
      }

      net.connected = connected;
      net.chainId = desiredChainId;
      next.network = net;
      log('network sync: applied', { connected, chainId: desiredChainId });
      return next;
    }, 'provider:syncNetworkAndWallet');
  }, [isConnected, wagmiChainId, contextState, setExchangeContext]);

  // Hydrate name/symbol/logo/url from APP chain selection
  useEffect(() => {
    if (!contextState) return;
    const currentAppId = contextState.network?.appChainId ?? 0;

    setExchangeContext((prev) => {
      const prevApp = prev.network?.appChainId ?? 0;
      if (prevApp === currentAppId) {
        log('appChain hydrate: no change', { appChainId: currentAppId });
        return prev;
      }
      const next = clone(prev);
      next.network = deriveNetworkFromApp(currentAppId, next.network);
      log('appChain hydrate: applied', { prevApp, nextApp: currentAppId });
      return next;
    }, 'provider:hydrateFromAppChain');
  }, [contextState?.network?.appChainId, contextState, setExchangeContext]);

  if (!contextState) {
    log('render gate: contextState not ready yet');
    return null;
  }

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
