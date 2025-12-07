'use client';

// File: @/lib/context/hooks/ExchangeContext/nested/network/useNetworkController.ts

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
  const { exchangeContext, setAppChainId } = useExchangeContext();
  const [appConnected, setAppConnected] = useConnected();

  const appChainId = exchangeContext.network?.appChainId ?? 0;

  // LS boot flag from initExchangeContext:
  //   hydratedFromLocalStorage === false  → this boot started with *no* stored context.
  const hydratedFromLocalStorage = !!exchangeContext.settings
    ?.hydratedFromLocalStorage;

  const { switchChainAsync } = useSwitchChain();

  // One-shot guard: we only ever "adopt wallet on first connect" once per page load.
  const adoptedOnFirstConnectRef = useRef(false);

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
      return;
    }

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

    // 4) App has a network and wallet disagrees → app is authoritative (Case D).
    if (walletChainId !== appChainId) {
      logState('switch-wallet', {
        msg: 'Wallet chain mismatch → switch wallet to appChainId (Case D)',
      });
      switchChainAsync({ chainId: appChainId }).catch((err) => {
        debugLog.error?.(
          '[switch-wallet] switchChainAsync failed; leaving wallet as-is',
          err,
        );
      });
      return;
    }

    // 5) Everything already aligned → noop.
    logState('noop', {
      msg: 'Wallet and app chain already aligned → no action',
    });
  }, [
    wagmiReady,
    walletConnected,
    status,
    walletChainId,
    appChainId,
    appConnected,
    hydratedFromLocalStorage,
    setAppChainId,
    setAppConnected,
    switchChainAsync,
  ]);

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
