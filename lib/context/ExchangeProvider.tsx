// File: lib/context/ExchangeProvider.tsx
'use client';

import React, { createContext, useEffect, useRef, useState } from 'react';
import { useChainId, useAccount } from 'wagmi';
import type { Address } from 'viem';
import { saveLocalExchangeContext } from '@/lib/context/helpers/ExchangeSaveHelpers';
import { initExchangeContext } from '@/lib/context/helpers/initExchangeContext';

import {
  ExchangeContext as ExchangeContextTypeOnly,
  TRADE_DIRECTION,
  TokenContract,
  ErrorMessage,
  WalletAccount,
  SP_COIN_DISPLAY,
} from '@/lib/structure';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useActiveAccount } from '@/lib/context/hooks/nestedHooks/useActiveAccount';

const LOG_TIME = false;
const LOG_LEVEL = 'info';
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_WRAPPER === 'true';
const debugLog = createDebugLogger('ExchangeProvider', DEBUG_ENABLED, LOG_TIME, LOG_LEVEL);

/* -------------------------- small local utilities -------------------------- */
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;

function lower(addr?: string | Address) {
  return addr ? (addr as string).toLowerCase() : undefined;
}

function shallowEqual<T extends Record<string, any>>(a?: T, b?: T) {
  if (a === b) return true;
  if (!a || !b) return false;
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) if (a[k] !== b[k]) return false;
  return true;
}
/* -------------------------------------------------------------------------- */

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
  errorMessage: ErrorMessage | undefined;
  setErrorMessage: (error: ErrorMessage | undefined) => void;
  apiErrorMessage: ErrorMessage | undefined;
  setApiErrorMessage: (error: ErrorMessage | undefined) => void;
};

export const ExchangeContextState = createContext<ExchangeContextType | null>(null);

/** Runs side-effect hooks that require ExchangeContext to be available. */
function ExchangeRuntime({ children }: { children: React.ReactNode }) {
  // ✅ This runs inside the Provider, so useExchangeContext() inside the hook is safe.
  useActiveAccount();
  return <>{children}</>;
}

export function ExchangeProvider({ children }: { children: React.ReactNode }) {
  // ---- single external sources of truth (wagmi) ----
  const wagmiChainId = useChainId();
  const { address, isConnected, status: accountStatus } = useAccount();

  // ---- provider state ----
  const [contextState, setContextState] = useState<ExchangeContextTypeOnly | undefined>();
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | undefined>();
  const [apiErrorMessage, setApiErrorMessage] = useState<ErrorMessage | undefined>();
  const hasInitializedRef = useRef(false);

  // ---- previous-slice refs for precise watchers (avoid redundant updates) ----
  const prevWagmiChainRef = useRef<number | undefined>();
  const prevCtxChainRef = useRef<number | undefined>();
  const prevAccountRef = useRef<{ address?: string; status?: string; connected?: boolean }>();
  const prevTokensRef = useRef<{ sell?: string; buy?: string }>();

  // ---- public setter with persistence + debug ----
  const setExchangeContext = (
    updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly,
    hookName = 'unknown'
  ) => {
    setContextState((prev) => {
      debugLog.log('🧪 setExchangeContext triggered by', hookName);

      const updated = prev ? updater(structuredClone(prev)) : prev;

      if (prev && updated && updated.network?.chainId !== prev.network?.chainId) {
        debugLog.warn(
          `⚠️ network.chainId changed in setExchangeContext → ${prev.network?.chainId} ➝ ${updated.network?.chainId} 🔁 hook: ${hookName}`
        );
      }

      if (updated) {
        saveLocalExchangeContext(updated);
        debugLog.log('📦 exchangeContext saved to localStorage');
      }

      return updated;
    });
  };

  // ---- convenience field setters (unchanged) ----
  const setRecipientAccount = (wallet: WalletAccount | undefined) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      cloned.accounts.recipientAccount = wallet;
      return cloned;
    }, 'setRecipientAccount');
  };

  const setSellAmount = (amount: bigint) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      if (cloned.tradeData.sellTokenContract) {
        cloned.tradeData.sellTokenContract.amount = amount;
      }
      return cloned;
    }, 'setSellAmount');
  };

  const setBuyAmount = (amount: bigint) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      if (cloned.tradeData.buyTokenContract) {
        cloned.tradeData.buyTokenContract.amount = amount;
      }
      return cloned;
    }, 'setBuyAmount');
  };

  const setSellTokenContract = (contract: TokenContract | undefined) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      cloned.tradeData.sellTokenContract = contract;
      return cloned;
    }, 'setSellTokenContract');
  };

  const setBuyTokenContract = (contract: TokenContract | undefined) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      cloned.tradeData.buyTokenContract = contract;
      return cloned;
    }, 'setBuyTokenContract');
  };

  const setTradeDirection = (type: TRADE_DIRECTION) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      cloned.tradeData.tradeDirection = type;
      return cloned;
    }, 'setTradeDirection');
  };

  const setSlippageBps = (bps: number) => {
    debugLog.log('🧾 setSlippageBps:', bps);
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      cloned.tradeData.slippage.bps = bps;
      return cloned;
    }, 'setSlippageBps');
  };

  // ---- initial hydration from localStorage + wagmi ----
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    initExchangeContext(wagmiChainId, isConnected, address).then((sanitized) => {
      debugLog.log('✅ Initial exchangeContext hydrated');
      debugLog.log(sanitized);
      setContextState(sanitized);

      // seed prev refs so first watcher pass is clean
      prevWagmiChainRef.current = wagmiChainId ?? undefined;
      prevCtxChainRef.current = sanitized.network?.chainId ?? undefined;
      prevAccountRef.current = {
        address: address ?? undefined,
        status: accountStatus,
        connected: isConnected,
      };
      prevTokensRef.current = {
        sell: lower(sanitized.tradeData.sellTokenContract?.address),
        buy: lower(sanitized.tradeData.buyTokenContract?.address),
      };
    });
  }, [wagmiChainId, address, isConnected, accountStatus]);

  /* ------------------------------------------------------------------------ *
   *                           CENTRALIZED WATCHERS
   *  Single source of truth rules:
   *  - When CONNECTED: wagmi's chainId drives context chainId.
   *  - When DISCONNECTED: user may choose a local chain (context chainId)
   *    and we must NOT overwrite it with wagmi's last seen id.
   *  We clear selected tokens whenever the EFFECTIVE chain changes.
   * ------------------------------------------------------------------------ */

  // 1) CONNECTED: wagmi chain watcher → sync context & clear tokens
  useEffect(() => {
    if (!contextState) return;

    // Only react to wagmi chain changes when connected.
    if (!isConnected) {
      // track last seen wagmi id for future comparisons
      prevWagmiChainRef.current = wagmiChainId ?? undefined;
      return;
    }

    const prevWagmi = prevWagmiChainRef.current;
    const nextWagmi = wagmiChainId ?? 0;

    if (prevWagmi === nextWagmi) return;

    debugLog.log(`🌐 (connected) wagmi.chainId changed: ${prevWagmi} → ${nextWagmi}`);

    setExchangeContext((prevCtx) => {
      const next = structuredClone(prevCtx);

      // update network to wagmi chain
      next.network.chainId = nextWagmi;

      // ✅ clear selected tokens when network changes (avoid cross-chain stale tokens)
      next.tradeData.sellTokenContract = undefined;
      next.tradeData.buyTokenContract = undefined;

      return next;
    }, 'watcher:wagmiChain(connected):clearTokens');

    prevWagmiChainRef.current = nextWagmi;
    // reset token prev tracker so token watcher won't churn
    prevTokensRef.current = { sell: undefined, buy: undefined };
  }, [isConnected, wagmiChainId, contextState, setExchangeContext]);

  // 2) DISCONNECTED (or UI-driven): context chain watcher → clear tokens on local chain change
  useEffect(() => {
    if (!contextState) return;

    const ctxChain = contextState.network?.chainId ?? 0;
    const prevCtxChain = prevCtxChainRef.current ?? 0;

    if (ctxChain === prevCtxChain) return;

    // If disconnected OR context chain differs from current wagmi chain,
    // treat as a local chain selection change, and clear selected tokens.
    const isLocalChange = !isConnected || ctxChain !== (wagmiChainId ?? 0);
    if (!isLocalChange) {
      // update tracker and bail (wagmi watcher will handle)
      prevCtxChainRef.current = ctxChain;
      return;
    }

    debugLog.log(
      `🧭 (local) context.network.chainId changed: ${prevCtxChain} → ${ctxChain} (isConnected=${isConnected})`
    );

    setExchangeContext((prevCtx) => {
      const next = structuredClone(prevCtx);
      next.tradeData.sellTokenContract = undefined;
      next.tradeData.buyTokenContract = undefined;
      return next;
    }, 'watcher:contextChain(local):clearTokens');

    prevCtxChainRef.current = ctxChain;
    prevTokensRef.current = { sell: undefined, buy: undefined };
  }, [contextState?.network?.chainId, isConnected, wagmiChainId, setExchangeContext, contextState]);

  // 3) Account watcher — reflect connected account and clear balances on change
  useEffect(() => {
    if (!contextState) return;
    const prev = prevAccountRef.current;
    const nextSlice = {
      address: address ?? undefined,
      status: accountStatus,
      connected: isConnected,
    };

    if (shallowEqual(prev, nextSlice)) return;

    debugLog.log(`👤 account changed: ${JSON.stringify(prev)} → ${JSON.stringify(nextSlice)}`);

    setExchangeContext((prevCtx) => {
      const next = structuredClone(prevCtx);

      // ensure accounts.connectedAccount exists and is updated
      const current = next.accounts.connectedAccount ?? ({} as WalletAccount);
      next.accounts.connectedAccount = {
        ...current,
        address: (nextSlice.address ?? ZERO_ADDRESS) as Address,
      };

      // clear balances when account context changes
      if (next.tradeData.sellTokenContract) next.tradeData.sellTokenContract.balance = 0n;
      if (next.tradeData.buyTokenContract) next.tradeData.buyTokenContract.balance = 0n;

      return next;
    }, 'watcher:account');

    prevAccountRef.current = nextSlice;
  }, [address, accountStatus, isConnected, contextState]);

  // 4) Token watcher — prevent duplicates and auto-close selection panel(s)
  useEffect(() => {
    if (!contextState) return;

    const sellAddr = lower(contextState.tradeData.sellTokenContract?.address);
    const buyAddr = lower(contextState.tradeData.buyTokenContract?.address);

    const prev = prevTokensRef.current;
    const nextSlice = { sell: sellAddr, buy: buyAddr };

    if (shallowEqual(prev, nextSlice)) return;

    debugLog.log(`🔁 tokens changed: ${JSON.stringify(prev)} → ${JSON.stringify(nextSlice)}`);

    // A) Duplicate prevention (simple policy: unset the buy side if duplicate)
    if (sellAddr && buyAddr && sellAddr === buyAddr) {
      setExchangeContext((prevCtx) => {
        const next = structuredClone(prevCtx);
        next.tradeData.buyTokenContract = undefined;
        return next;
      }, 'watcher:tokens:dedupe');
    }

    // B) Close selection panel if a select panel is open (BUY/SELL) after a token commit
    const isSelectPanelOpen =
      contextState.settings?.activeDisplay === SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL ||
      contextState.settings?.activeDisplay === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL;

    if ((sellAddr || buyAddr) && isSelectPanelOpen) {
      setExchangeContext((prevCtx) => {
        const next = structuredClone(prevCtx);
        next.settings.activeDisplay = SP_COIN_DISPLAY.TRADING_STATION_PANEL;
        return next;
      }, 'watcher:tokens:autoClose');
    }

    prevTokensRef.current = nextSlice;
  }, [
    contextState,
    contextState?.tradeData.sellTokenContract?.address,
    contextState?.tradeData.buyTokenContract?.address,
    contextState?.settings?.activeDisplay,
  ]);

  return (
    <ExchangeContextState.Provider
      value={{
        exchangeContext: {
          ...contextState,
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
        errorMessage,
        setErrorMessage,
        apiErrorMessage,
        setApiErrorMessage,
      }}
    >
      {/* Only render runtime + children after context is ready */}
      {contextState && <ExchangeRuntime>{children}</ExchangeRuntime>}
    </ExchangeContextState.Provider>
  );
}
