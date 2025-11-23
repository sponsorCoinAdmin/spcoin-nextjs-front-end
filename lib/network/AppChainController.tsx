// File: @/lib/network/AppChainController.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useAccount, useChainId as useWagmiChainId, useSwitchChain } from 'wagmi';
import { useAppChainId } from '@/lib/context/hooks';

// Env flags (match your existing hook semantics)
const MIRROR_WALLET_TO_APP_ON_INIT =
  process.env.NEXT_PUBLIC_MIRROR_WALLET_CHAIN_ID_ON_INIT !== 'false'; // default: true
const MIRROR_APP_TO_WALLET =
  process.env.NEXT_PUBLIC_MIRROR_APP_CHAIN_ID_TO_WALLET === 'true';   // default: false

const PREFERRED_KEY = 'preferredChainId';

/**
 * AppChainController (keeps your current structure)
 *
 * - Uses your existing `useAppChainId()` hook (no new stores/providers).
 * - When DISCONNECTED:
 *    • If appChainId is 0, seeds from localStorage.preferredChainId (if set).
 * - When CONNECTED:
 *    • If MIRROR_APP_TO_WALLET is true, mirrors app→wallet.
 *    • Otherwise, on first connect, auto-switch wallet to preferred/app chain once.
 * - When WALLET CHAIN changes and MIRROR_WALLET_TO_APP_ON_INIT is enabled,
 *    seeds the app on first load only (when appChainId is 0).
 */
export default function AppChainController() {
  // Wallet state (wagmi)
  const { isConnected, status } = useAccount();
  const walletChainId = useWagmiChainId() || 0;
  const { switchChainAsync } = useSwitchChain();

  // App state (your existing hook)
  const [appChainId, setAppChainId] = useAppChainId();

  // Guard: ensure some effects run only once per connect session
  const didAutoSyncOnConnect = useRef(false);
  const didSeedFromPreferred = useRef(false);
  const didSeedWalletToApp = useRef(false);

  /** 1) Seed APP from WALLET once on init (only if appChainId is 0) */
  useEffect(() => {
    if (!MIRROR_WALLET_TO_APP_ON_INIT) return;
    if (appChainId && appChainId > 0) return;    // app already chosen
    if (walletChainId > 0) {
      setAppChainId(walletChainId);
    }
  }, [walletChainId, appChainId, setAppChainId]);

  /** 2) When DISCONNECTED and appChainId is 0, seed from preferredChainId (if any) */
  useEffect(() => {
    if (isConnected) return;
    if (didSeedFromPreferred.current) return;
    if (appChainId && appChainId > 0) return;

    const raw = typeof window !== 'undefined'
      ? window.localStorage.getItem(PREFERRED_KEY)
      : null;
    const preferred = raw ? Number(raw) : 0;

    if (preferred > 0) {
      setAppChainId(preferred); // user-chosen network while disconnected
      didSeedFromPreferred.current = true;
    }
  }, [isConnected, appChainId, setAppChainId]);

  /** 3) If MIRROR_APP_TO_WALLET is ON, keep wallet in sync while CONNECTED */
  useEffect(() => {
    if (!MIRROR_APP_TO_WALLET) return;
    if (!isConnected) return;
    if (!(appChainId > 0)) return;
    if (walletChainId === appChainId) return;
    if (didSeedWalletToApp.current) return;

    (async () => {
      try {
        await switchChainAsync?.({ chainId: appChainId });
      } catch {
        /* user rejected or wallet can’t switch */
      } finally {
        didSeedWalletToApp.current = true;
        if (typeof window !== 'undefined') {
          const raw = window.localStorage.getItem(PREFERRED_KEY);
          if (raw && Number(raw) === appChainId) {
            window.localStorage.removeItem(PREFERRED_KEY);
          }
        }
      }
    })();
  }, [isConnected, appChainId, walletChainId, switchChainAsync]);

  /**
   * 4) Auto-sync ON CONNECT exactly once:
   *    If MIRROR_APP_TO_WALLET is OFF (the common case), when user connects
   *    and there is a preferredChainId (or appChainId differs from wallet),
   *    request a wallet switch once.
   */
  useEffect(() => {
    if (status !== 'connected') {
      didAutoSyncOnConnect.current = false;
      didSeedWalletToApp.current = false;
      return;
    }
    if (MIRROR_APP_TO_WALLET) return; // handled by effect (3)
    if (didAutoSyncOnConnect.current) return;

    const raw = typeof window !== 'undefined'
      ? window.localStorage.getItem(PREFERRED_KEY)
      : null;
    const preferred = raw ? Number(raw) : 0;

    const target = preferred > 0 ? preferred : appChainId;
    if (!(target > 0) || target === walletChainId) {
      // nothing to do; clear preferred if it matches
      if (preferred > 0 && preferred === walletChainId && typeof window !== 'undefined') {
        window.localStorage.removeItem(PREFERRED_KEY);
      }
      didAutoSyncOnConnect.current = true;
      return;
    }

    (async () => {
      try {
        await switchChainAsync?.({ chainId: target });
        setAppChainId(target); // keep app and wallet aligned
        if (typeof window !== 'undefined') {
          const raw2 = window.localStorage.getItem(PREFERRED_KEY);
          if (raw2 && Number(raw2) === target) {
            window.localStorage.removeItem(PREFERRED_KEY);
          }
        }
      } catch {
        // user rejected → keep preferred to try again later
      } finally {
        didAutoSyncOnConnect.current = true;
      }
    })();
  }, [status, appChainId, walletChainId, switchChainAsync, setAppChainId]);

  return null; // controller has no UI
}
