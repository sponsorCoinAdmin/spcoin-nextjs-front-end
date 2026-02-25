// File: @/lib/utils/network/hooks/useNetworkController.ts
'use client';

/**
 * useNetworkController
 *
 * Central policy for network resolution (Cases A–D):
 *
 * NOTE:
 *  - This hook is meant to be called once at a high level (e.g. in AppChainController).
 *  - All components that just *read* the network should use `useAppChainId` / `useNetwork` / `useConnected`.
 *
 * What happens on Application Load/Refresh/Connect:
 *
 * Case A: Wallet Disconnected / Local Storage Empty
 *   appChainId = 1 (default Ethereum)
 *   chainId    = undefined      (we model this as appChainId=1, connected=false)
 *
 * Case B: Wallet Connected / Local Storage Empty
 *   appChainId = wallet.chainId
 *   chainId    = wallet.chainId
 *
 * Case C: Wallet Disconnected / Local Storage Available
 *   appChainId = stored appChainId
 *   chainId    = stored chainId (last known)
 *
 * Case D: Wallet Connected / Local Storage Available
 *   appChainId = stored appChainId
 *   chainId    = stored chainId
 *   → wallet is switched to appChainId if needed
 *
 * ┌──────┬────────────┬───────────────┬───────────────────────────────────────────────────────┐
 * │ Case │ Connected  │ Local Storage │ Result / Action                                       │
 * │      │            │   Available   │                                                       │
 * ├──────┼────────────┼───────────────┼───────────────────────────────────────────────────────┤
 * │  A   │ NO         │ NO            │ appChainId = 1 (default Ethereum)                     │
 * │      │            │               │ chainId = undefined                                   │
 * ├──────┼────────────┼───────────────┼───────────────────────────────────────────────────────┤
 * │  B   │ YES        │ NO            │ appChainId = wallet.chainId                           │
 * │      │            │               │ chainId = wallet.chainId                              │
 * ├──────┼────────────┼───────────────┼───────────────────────────────────────────────────────┤
 * │  C   │ NO         │ YES           │ appChainId = stored appChainId                        │
 * │      │            │               │ chainId = stored chainId                              │
 * ├──────┼────────────┼───────────────┼───────────────────────────────────────────────────────┤
 * │  D   │ YES        │ YES           │ appChainId = stored appChainId                        │
 * │      │            │               │ chainId = stored chainId                              │
 * │      │            │               │ ACTION: switch wallet to appChainId if mismatched     │
 * ├──────┴────────────┴───────────────┴───────────────────────────────────────────────────────┤
 * │                          Summary Network Resolution                                       │
 * ├───────────────────────────────────────────────────────────────────────────────────────────┤
 * │ LS empty + no wallet     → default network to 1, Ethereum.                                │
 * │ LS empty + wallet        → app follows wallet (Case B + first-connect adopt rule).        │
 * │ LS available + no wallet → app restores last known network (Case C).                      │
 * │ LS available + wallet    → app restores last known network and forces wallet to match     │
 * │                            appChainId when connected (Case D).                            │
 * └───────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * Implementation note
 * --------------------
 * The *persistence* layer (localStorage + initial Case A–D choice) is handled
 * by `initExchangeContext(...)` inside `ExchangeProvider`. This hook stays
 * lean and focuses on keeping three things in sync *after* wagmi is ready:
 *
 *   • `walletChainId`   (wagmi)
 *   • `appChainId`      (ExchangeContext.network)
 *   • `connected` flag  (ExchangeContext.network)
 *
 * In other words: ExchangeProvider decides "which network" on boot, and
 * `useNetworkController` enforces that policy at runtime.
 */

import { useEffect, useRef } from 'react';
import {
  useAccount,
  useChainId as useWalletChainId,
  useSwitchChain,
} from 'wagmi';

import { useConnected } from './useConnected';
import { useExchangeContext } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useWagmiReady } from '@/lib/network/initialize/hooks/useWagmiReady';
import { getBlockChainName } from '@/lib/utils/network';
import { SP_COIN_DISPLAY, STATUS } from '@/lib/structure';
import { CHAIN_ID } from '@/lib/structure/enums/networkIds';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import * as viemChains from 'viem/chains';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_USE_NETWORK_CONTROLLER === 'true';

const debugLog = createDebugLogger(
  'useNetworkController',
  DEBUG_ENABLED,
  LOG_TIME,
);

export function useNetworkController() {
  const { isConnected: walletConnected, status } = useAccount();
  const walletChainId = useWalletChainId();
  const wagmiReady = useWagmiReady();

  // Authoritative app context + setter from the provider
  const { exchangeContext, setAppChainId, setExchangeContext, setErrorMessage } = useExchangeContext();
  const [appConnected, setAppConnected] = useConnected();
  const { openPanel } = usePanelTree();

  const appChainId = exchangeContext.network?.appChainId ?? 0;

  // LS boot flag from initExchangeContext:
  //   hydratedFromLocalStorage === false  → this boot started with *no* stored context.
  const hydratedFromLocalStorage = !!exchangeContext.settings
    ?.hydratedFromLocalStorage;
  const { switchChainAsync } = useSwitchChain();

  // One-shot guard: we only ever "adopt wallet on first connect" once per page load.
  const adoptedOnFirstConnectRef = useRef(false);
  const prevWalletChainIdRef = useRef<number | undefined>(undefined);
  const prevAppChainIdRef = useRef<number | undefined>(undefined);
  const prevWalletConnectedRef = useRef<boolean>(false);

  const getWagmiChainName = (id?: number): string | undefined => {
    if (typeof id !== 'number' || id <= 0) return undefined;
    const values = Object.values(viemChains) as unknown[];
    for (const v of values) {
      if (!v || typeof v !== 'object') continue;
      const obj = v as { id?: number; name?: string };
      if (obj.id === id && typeof obj.name === 'string' && obj.name.trim().length > 0) {
        return obj.name.trim();
      }
    }
    return undefined;
  };

  const chainLabel = (id?: number) =>
    typeof id === 'number' && id > 0
      ? getWagmiChainName(id) || getBlockChainName(id) || `Chain ${id}`
      : 'Unknown';
  const SUPPORTED_CHAIN_IDS = new Set<number>(
    Object.values(CHAIN_ID).filter((v): v is number => typeof v === 'number'),
  );

  const syncNetworkChainId = (nextChainId: number, connected: boolean) => {
    setExchangeContext(
      (prev) => {
        if (
          prev.network.chainId === nextChainId &&
          prev.network.connected === connected
        ) {
          return prev;
        }
        return {
          ...prev,
          network: {
            ...prev.network,
            chainId: nextChainId,
            connected,
          },
        };
      },
      'useNetworkController:syncNetworkChainId',
    );
  };

  // Fallback listener for injected wallets (MetaMask):
  // when wallet network changes outside wagmi UI controls, mirror it into appChainId.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const eth = (window as any).ethereum;
    if (!eth || typeof eth.on !== 'function') return;

    const onChainChanged = (hexChainId: string) => {
      const nextId = Number.parseInt(String(hexChainId), 16);
      if (!Number.isFinite(nextId) || nextId <= 0) return;
      const prevId = prevWalletChainIdRef.current;
      const appId = appChainId;

      debugLog.log?.('[wallet:chainChanged]', {
        hexChainId,
        nextId,
        prevId,
        appChainId,
        walletConnected,
      });

      if (!SUPPORTED_CHAIN_IDS.has(nextId)) {
        const metamaskName = chainLabel(nextId);
        const spCoinName = chainLabel(appId);
        const msg =
          `Unsuported  Network ${metamaskName}(${nextId})\n` +
          `\n` +
          `WARNING: Networks not in sync\n` +
          `Metamask Network: ${metamaskName} chainId: ${nextId}\n` +
          `Spoonsor Coin Network: ${spCoinName} appChainId: ${appId}\n`;

        setErrorMessage({
          errCode: nextId,
          msg,
          source: 'useNetworkController:onChainChanged',
          status: STATUS.MESSAGE_ERROR,
        });
        openPanel(
          SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL,
          'useNetworkController:onUnsupportedWalletChain(open ERROR_MESSAGE_PANEL)',
        );

        // Keep app intent unchanged; wallet is on unsupported chain.
        syncNetworkChainId(nextId, true);
        prevWalletChainIdRef.current = nextId;
        return;
      }

      setAppChainId(nextId);
      if (!appConnected) setAppConnected(true);
      prevWalletChainIdRef.current = nextId;
    };

    eth.on('chainChanged', onChainChanged);
    return () => {
      try {
        if (typeof eth.removeListener === 'function') {
          eth.removeListener('chainChanged', onChainChanged);
        }
      } catch {
        // no-op cleanup guard for non-standard providers
      }
    };
  }, [appChainId, appConnected, openPanel, setAppChainId, setAppConnected, setErrorMessage, walletConnected]);

  useEffect(() => {
    const walletChainIsValid =
      typeof walletChainId === 'number' && walletChainId > 0;

    const logState = (phase: string, extra?: Record<string, unknown>) => {
      debugLog.log?.(`[${phase}]`, {
        wagmiReady,
        walletConnected,
        walletStatus: status,
        walletChainId,
        walletChainIsValid,
        appChainId,
        appConnected,
        hydratedFromLocalStorage,
        adoptedOnFirstConnect: adoptedOnFirstConnectRef.current,
        ...(extra ?? {}),
      });
    };

    // 0) Wait for wagmi handshake – until wagmiReady, we don't trust isConnected/chainId.
    if (!wagmiReady) {
      logState('skip:wagmi-not-ready');
      return;
    }

    // 1) Wallet disconnected → just mark app as disconnected.
    //    Case A/C network choice has already been made by initExchangeContext.
    if (!walletConnected) {
      logState('wallet-disconnected', {
        msg: 'Wallet disconnected → mark appConnected=false (keep appChainId)',
      });
      if (appConnected) setAppConnected(false);
      // Rule: when disconnected, chainId should be 0.
      syncNetworkChainId(0, false);
      prevWalletConnectedRef.current = false;
      return;
    }

    const justConnected = !prevWalletConnectedRef.current && walletConnected;

    // Wallet is connected from this point onwards.
    if (!appConnected) {
      logState('set-app-connected-true', {
        msg: 'Wallet connected → mark appConnected=true',
      });
      setAppConnected(true);
    }
    // If wagmi still hasn't surfaced a valid chain id, there's nothing we can
    // reconcile yet. Wait for a real number.
    if (!walletChainIsValid) {
      logState('wallet-chain-invalid', {
        msg: 'Wallet connected but walletChainId is 0/undefined → wait',
      });
      return;
    }

    // We only mark "connected seen" once wagmi exposes a valid wallet chain.
    prevWalletConnectedRef.current = true;

    // Rule: chainId reflects wallet-active network while connected.
    syncNetworkChainId(walletChainId, true);

    if (justConnected && appChainId > 0 && walletChainId !== appChainId) {
      logState('switch-wallet-on-connect', {
        msg: 'Just connected and wallet chain mismatched appChainId -> switch wallet to appChainId',
      });
      switchChainAsync({ chainId: appChainId }).catch((err) => {
        const code = err?.code ?? err?.cause?.code;
        if (code === 4902) {
          alert(
            `MetaMask network ${chainLabel(appChainId)} is not installed. Please add it to MetaMask.`,
          );
          return;
        }
        debugLog.error?.('[switch-wallet-on-connect] switchChainAsync failed', err);
      });
      return;
    }

    // 2) SPECIAL CASE: Fresh boot with *no* LocalStorage (LS empty)
    //    and app network is still the default 1, but wallet is already on a different chain.
    if (
      !hydratedFromLocalStorage &&
      !adoptedOnFirstConnectRef.current &&
      appChainId === 1 &&
      walletChainId !== 1
    ) {
      adoptedOnFirstConnectRef.current = true;
      logState('adopt-wallet-on-first-connect', {
        msg: 'Fresh boot (no LS) + default appChainId=1 + wallet on non-1 → adopt walletChainId',
      });

      // ALWAYS persist via provider-level setter (writes through to LS)
      setAppChainId(walletChainId);
      return;
    }

    // 3) No app network chosen yet → adopt wallet (Case B).
    if (!appChainId || appChainId === 0) {
      logState('adopt-wallet', {
        msg: 'appChainId is 0 → adopt walletChainId as appChainId (Case B)',
      });
      setAppChainId(walletChainId);
      return;
    }

    // 4) App has a network and wallet disagrees:
    //    - if app changed and wallet didn't -> app-driven change, switch wallet
    //    - otherwise -> wallet-driven change, adopt wallet in app
    if (walletChainId !== appChainId) {
      const prevWallet = prevWalletChainIdRef.current;
      const prevApp = prevAppChainIdRef.current;
      const walletChanged = typeof prevWallet === 'number' && prevWallet !== walletChainId;
      const appChanged = typeof prevApp === 'number' && prevApp !== appChainId;

      if (appChanged && !walletChanged) {
        logState('switch-wallet-on-app-change', {
          msg: 'App chain changed while wallet stayed same -> switch wallet',
          prevWallet,
          prevApp,
        });
        switchChainAsync({ chainId: appChainId }).catch((err) => {
          const code = err?.code ?? err?.cause?.code;
          if (code === 4902) {
            alert(
              `MetaMask network ${chainLabel(appChainId)} is not installed. Please add it to MetaMask.`,
            );
            return;
          }
          debugLog.error?.(
            '[switch-wallet-on-app-change] switchChainAsync failed',
            err,
          );
        });
      } else {
        logState('adopt-wallet-on-mismatch', {
          msg: 'Wallet chain changed or both changed -> adopt walletChainId in app',
          prevWallet,
          prevApp,
        });
        setAppChainId(walletChainId);
      }
      return;
    }

    // 5) Everything already aligned → noop.
    logState('noop', {
      msg: 'Wallet and app chain already aligned → no action',
    });

    prevWalletChainIdRef.current = walletChainId;
    prevAppChainIdRef.current = appChainId;
    prevWalletConnectedRef.current = walletConnected;
  }, [
    wagmiReady,
    walletConnected,
    status,
    walletChainId,
    appChainId,
    appConnected,
    hydratedFromLocalStorage,
    setAppChainId,
    setExchangeContext,
    setAppConnected,
    switchChainAsync,
  ]);

  useEffect(() => {
    if (typeof walletChainId === 'number' && walletChainId > 0) {
      prevWalletChainIdRef.current = walletChainId;
    }
    if (typeof appChainId === 'number' && appChainId > 0) {
      prevAppChainIdRef.current = appChainId;
    }
  }, [walletChainId, appChainId]);

  const walletChainIsValid =
    typeof walletChainId === 'number' && walletChainId > 0;

  // Snapshot for debugging / inspection.
  return {
    appChainId,
    appConnected,
    walletConnected,
    walletStatus: status,
    walletChainId: walletChainIsValid ? walletChainId : undefined,
  };
}
