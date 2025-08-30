// File: lib/context/providers/useProviderWatchers.ts

import { useEffect, useRef } from 'react';
import type { Address } from 'viem';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import type {
  ExchangeContext as ExchangeContextTypeOnly,
  WalletAccount,
} from '@/lib/structure';
import { resolveNetworkElement } from '@/lib/context/helpers/NetworkHelpers';

const lower = (a?: string | Address) => (a ? (a as string).toLowerCase() : undefined);
const shallowEqual = <T extends Record<string, any>>(a?: T, b?: T) => {
  if (a === b) return true;
  if (!a || !b) return false;
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) if (a[k] !== b[k]) return false;
  return true;
};

type SetExchange = (
  updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly,
  hookName?: string
) => void;

type Params = {
  contextState?: ExchangeContextTypeOnly;
  setExchangeContext: SetExchange;
  wagmiChainId?: number;
  isConnected: boolean;
  address?: string | undefined;
  accountStatus?: string;
};

export function useProviderWatchers({
  contextState,
  setExchangeContext,
  wagmiChainId,
  isConnected,
  address,
  accountStatus,
}: Params) {
  const prevWagmiChainRef = useRef<number | undefined>();
  const prevCtxChainRef = useRef<number | undefined>();
  const prevAccountRef = useRef<{ address?: string; status?: string; connected?: boolean }>();
  const prevTokensRef = useRef<{ sell?: string; buy?: string }>();

  // CONNECTED: wagmi chain watcher → hydrate full NetworkElement + clear tokens
  useEffect(() => {
    if (!contextState) return;

    if (!isConnected) {
      prevWagmiChainRef.current = wagmiChainId ?? undefined;
      return;
    }

    const prevWagmi = prevWagmiChainRef.current;
    const nextWagmi = wagmiChainId ?? 0;
    if (prevWagmi === nextWagmi) return;

    setExchangeContext((prevCtx) => {
      const next = structuredClone(prevCtx);

      // ✅ Overwrite chain-derived fields when chain changes
      next.network = resolveNetworkElement(nextWagmi, next.network);

      // Clear cross-chain selections
      next.tradeData.sellTokenContract = undefined;
      next.tradeData.buyTokenContract = undefined;

      return next;
    }, 'watcher:wagmiChain(connected):hydrateNetwork+clearTokens');

    prevWagmiChainRef.current = nextWagmi;
    prevTokensRef.current = { sell: undefined, buy: undefined };
  }, [isConnected, wagmiChainId, contextState, setExchangeContext]);

  // DISCONNECTED / UI-driven: context chain watcher → hydrate network + clear tokens
  useEffect(() => {
    if (!contextState) return;

    const ctxChain = contextState.network?.chainId ?? 0;
    const prevCtxChain = prevCtxChainRef.current ?? 0;
    if (ctxChain === prevCtxChain) return;

    const isLocalChange = !isConnected || ctxChain !== (wagmiChainId ?? 0);
    if (!isLocalChange) {
      prevCtxChainRef.current = ctxChain;
      return;
    }

    setExchangeContext((prevCtx) => {
      const next = structuredClone(prevCtx);

      // ✅ Hydrate full NetworkElement for local chain selection
      next.network = resolveNetworkElement(ctxChain, next.network);

      next.tradeData.sellTokenContract = undefined;
      next.tradeData.buyTokenContract = undefined;

      return next;
    }, 'watcher:contextChain(local):hydrateNetwork+clearTokens');

    prevCtxChainRef.current = ctxChain;
    prevTokensRef.current = { sell: undefined, buy: undefined };
  }, [contextState?.network?.chainId, isConnected, wagmiChainId, setExchangeContext, contextState]);

  // Account watcher — reflect connected account and clear balances on change
  useEffect(() => {
    if (!contextState) return;

    const prev = prevAccountRef.current;
    const nextSlice = {
      address: address ?? undefined,
      status: accountStatus,
      connected: isConnected,
    };
    if (shallowEqual(prev, nextSlice)) return;

    setExchangeContext((prevCtx) => {
      const next = structuredClone(prevCtx);

      if (nextSlice.address && isConnected) {
        // ✅ Wallet connected → hydrate connectedAccount with real address
        const current = next.accounts.connectedAccount ?? ({} as WalletAccount);
        next.accounts.connectedAccount = {
          ...current,
          address: nextSlice.address as Address,
        };
      } else {
        // ❌ Wallet disconnected → clear connectedAccount
        next.accounts.connectedAccount = undefined as any;
      }

      if (next.tradeData.sellTokenContract) next.tradeData.sellTokenContract.balance = 0n;
      if (next.tradeData.buyTokenContract) next.tradeData.buyTokenContract.balance = 0n;

      return next;
    }, 'watcher:account');

    prevAccountRef.current = nextSlice;
  }, [address, accountStatus, isConnected, contextState, setExchangeContext]);

  // Token watcher — prevent duplicates & auto-close selection panel(s)
  useEffect(() => {
    if (!contextState) return;

    const sellAddr = lower(contextState.tradeData.sellTokenContract?.address);
    const buyAddr = lower(contextState.tradeData.buyTokenContract?.address);

    const prev = prevTokensRef.current;
    const nextSlice = { sell: sellAddr, buy: buyAddr };
    if (shallowEqual(prev, nextSlice)) return;

    // A) Duplicate prevention
    if (sellAddr && buyAddr && sellAddr === buyAddr) {
      setExchangeContext((prevCtx) => {
        const next = structuredClone(prevCtx);
        next.tradeData.buyTokenContract = undefined;
        return next;
      }, 'watcher:tokens:dedupe');
    }

    // B) Close selection panel after a token commit
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
    setExchangeContext,
  ]);
}
