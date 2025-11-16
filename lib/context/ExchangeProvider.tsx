// File: lib/context/ExchangeProvider.tsx
'use client';

import React, { createContext, useEffect, useRef, useState } from 'react';
import { useAccount, useChainId as useWagmiChainId } from 'wagmi';

import { initExchangeContext } from '@/lib/context/helpers/initExchangeContext';
import { useProviderSetters } from '@/lib/context/hooks/ExchangeContext/hooks/useProviderSetters';
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

/* ---------------------------- Debug logger toggle --------------------------- */
const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_PROVIDER === 'true';

const debugLog = createDebugLogger(
  'ExchangeProvider',
  DEBUG_ENABLED,
  LOG_TIME,
);

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

/* --------------------------------- Provider -------------------------------- */

export function ExchangeProvider({ children }: { children: React.ReactNode }) {
  // ⬇️ Back to wagmi directly here to avoid context recursion
  const wagmiChainId = useWagmiChainId();
  const { address, isConnected } = useAccount();

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

      // Snapshot BEFORE applying updater to detect in-place mutations
      const prevStr = stringifyBigInt(prev);

      const nextBase = updater(prev);
      if (!nextBase) return prev;

      const nextStr = stringifyBigInt(nextBase);
      if (prevStr === nextStr) return prev; // true no-op, skip persistence

      // Normalize for persistence: shallow clone + normalized panel tree
      const normalized = clone(nextBase);
      if (Array.isArray((normalized as any)?.settings?.spCoinPanelTree)) {
        (normalized as any).settings.spCoinPanelTree =
          (normalized as any).settings.spCoinPanelTree;
      }
      (normalized as any).settings = {
        ...(normalized as any).settings,
        spCoinPanelSchemaVersion: PANEL_SCHEMA_VERSION,
      };

      // Persist (diff path only when DEBUG is enabled)
      persistWithOptDiff(prev, normalized, 'ExchangeContext.settings.spCoinPanelTree');

      return nextBase;
    });
  };

  // initial hydrate + normalize + migrate panels + immediate network reconcile
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    (async () => {
      debugLog.log?.('🚀 initExchangeContext boot start');

      const base = await initExchangeContext(wagmiChainId, isConnected, address);
      const settingsAny = (base as any).settings ?? {};
      const storedPanels = settingsAny.spCoinPanelTree as
        | PanelNode[]
        | undefined;

      // Panel repair + validation pipeline
      const repaired = repairPanels(
        isMainPanels(storedPanels) ? storedPanels : undefined,
      );
      const { panels: validated } = validateAndRepairPanels(repaired);
      const ensured = ensureRequiredPanels(
        dropNonPersisted(validated),
        MUST_INCLUDE_ON_BOOT,
      );
      const flatPanels = reconcileOverlayVisibility(ensured);

      const radioTopLevel: any[] =
        (settingsAny.mainPanelNode as any[]) ?? [];

      reconcilePanelState(
        flatPanels as any,
        radioTopLevel as any,
        SP_COIN_DISPLAY.TRADING_STATION_PANEL,
      );

      // Persist both, now coherent
      const nextSettings: any = {
        ...settingsAny,
        spCoinPanelTree: flatPanels.map((n) => ({
          panel: n.panel,
          name: n.name,
          visible: n.visible,
        })),
        mainPanelNode: radioTopLevel,
        spCoinPanelSchemaVersion: PANEL_SCHEMA_VERSION,
      };

      const net = ensureNetwork((base as any).network);
      net.connected = !!isConnected;
      net.chainId =
        isConnected && typeof wagmiChainId === 'number'
          ? (wagmiChainId as number)
          : 0;

      (base as any).network = net;
      (base as any).settings = nextSettings;

      // Persist on boot (diff path only when DEBUG is enabled)
      persistWithOptDiff(
        undefined,
        base as ExchangeContextTypeOnly,
        'ExchangeContext.settings.spCoinPanelTree',
      );

      // In-memory panel tree keeps full names
      (base as any).settings.spCoinPanelTree =
        ensurePanelNamesInMemory(flatPanels);

      setContextState(base as ExchangeContextTypeOnly);
      debugLog.log?.('✅ initExchangeContext boot complete');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Wallet/network sync for subsequent changes
  useEffect(() => {
    if (!contextState) return;

    setExchangeContext(
      (prev) => {
        const next = clone(prev);
        const net = ensureNetwork(next.network);
        const connected = !!isConnected;
        const desiredChainId =
          connected && typeof wagmiChainId === 'number'
            ? (wagmiChainId as number)
            : 0;

        if (net.connected === connected && net.chainId === desiredChainId) {
          return prev;
        }

        net.connected = connected;
        net.chainId = desiredChainId;
        next.network = net;
        return next;
      },
      'provider:syncNetworkAndWallet',
    );
  }, [isConnected, wagmiChainId, contextState, setExchangeContext]);

  /* 🔐 Authoritative sync of activeAccount from Wagmi */
  const lastAppliedAddrRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!contextState) return;

    const nextAddr = isConnected ? (address ?? undefined) : undefined;

    // 🛑 On disconnect / missing address:
    //     ➜ Do NOT clear accounts.activeAccount
    //     ➜ Just log and preserve previous value
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

  // 🩹 Repair after rehydrate (in case storage clobbers a live connection)
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

  /** SINGLE source of truth on appChainId change */
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

  /** Safety net: if logoURL ever drifts from the template for the current appId, fix it. */
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
      {/* Post-mount helpers that depend on ExchangeContext */}
      <PanelBootstrap />
      <AppBootstrap />
      {children}
    </ExchangeContextState.Provider>
  );
}
