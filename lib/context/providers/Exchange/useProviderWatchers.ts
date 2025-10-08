// File: lib/context/providers/useProviderWatchers.ts
import { useEffect, useRef } from 'react';
import type { Address } from 'viem';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import type {
  ExchangeContext as ExchangeContextTypeOnly,
  WalletAccount,
} from '@/lib/structure';
import type { SpCoinPanelTree } from '@/lib/structure/exchangeContext/types/PanelNode';
import { resolveNetworkElement } from '@/lib/context/helpers/NetworkHelpers';
import { MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/registry/panelRegistry';

/* ------------------------------- utils -------------------------------- */

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

const clone = <T,>(o: T): T =>
  typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));

/* ----------------------- Flat panel visibility helpers ---------------------- */

function anyVisible(panels: SpCoinPanelTree, ids: SP_COIN_DISPLAY[]): boolean {
  return panels.some((n) => ids.includes(n.panel as SP_COIN_DISPLAY) && !!n.visible);
}

function setOverlayVisible(panels: SpCoinPanelTree, targetId: SP_COIN_DISPLAY): SpCoinPanelTree {
  const next = clone(panels);
  for (const n of next) {
    if (MAIN_OVERLAY_GROUP.includes(n.panel as SP_COIN_DISPLAY)) {
      n.visible = (n.panel as SP_COIN_DISPLAY) === targetId;
    }
  }
  return next;
}

/* -------------------------------- types ------------------------------- */

type SetExchange = (
  updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly,
  hookName?: string
) => void;

type Params = {
  contextState?: ExchangeContextTypeOnly;
  setExchangeContext: SetExchange;
  wagmiChainId?: number;
  appChainId?: number;
  isConnected: boolean;
  address?: string | undefined;
  accountStatus?: string;
};

/* --------------------------- main hook logic --------------------------- */

export function useProviderWatchers({
  contextState,
  setExchangeContext,
  wagmiChainId,
  appChainId,
  isConnected,
  address,
  accountStatus,
}: Params) {
  const prevWagmiChainRef = useRef<number | undefined>();
  const prevCtxChainRef = useRef<number | undefined>();
  const prevAccountRef = useRef<{ address?: string; status?: string; connected?: boolean }>();
  const prevTokensRef = useRef<{ sell?: string; buy?: string }>();

  const isFirstWagmiRunRef = useRef(true);
  const isFirstCtxRunRef = useRef(true);

  /* ---------------- wagmi chain watcher (wallet-driven) ---------------- */
  useEffect(() => {
    if (!contextState) return;
    if (!isConnected || wagmiChainId == null) return;

    const prevWagmi = prevWagmiChainRef.current;
    const nextWagmi = wagmiChainId;

    if (isFirstWagmiRunRef.current) {
      isFirstWagmiRunRef.current = false;
      prevWagmiChainRef.current = nextWagmi;
      return;
    }

    if (prevWagmi === nextWagmi) return;

    setExchangeContext((prevCtx) => {
      const next = clone(prevCtx);
      const currentCtxChain = next.network?.chainId;

      next.network = resolveNetworkElement(nextWagmi, next.network);

      if (currentCtxChain !== nextWagmi) {
        next.tradeData.sellTokenContract = undefined;
        next.tradeData.buyTokenContract = undefined;
      }
      return next;
    }, 'watcher:wagmiChain');

    prevWagmiChainRef.current = nextWagmi;
    prevTokensRef.current = { sell: undefined, buy: undefined };
  }, [isConnected, wagmiChainId, contextState, setExchangeContext]);

  /* --------------- context/app chain watcher (UI/local) ---------------- */
  useEffect(() => {
    const ctxChain =
      (typeof appChainId === 'number' ? appChainId : contextState?.network?.chainId);
    if (!contextState) return;
    if (ctxChain == null) return;

    if (isFirstCtxRunRef.current) {
      isFirstCtxRunRef.current = false;
      prevCtxChainRef.current = ctxChain;
      return;
    }

    const prevCtxChain = prevCtxChainRef.current ?? ctxChain;
    if (ctxChain === prevCtxChain) return;

    const isLocalChange = !isConnected || (wagmiChainId != null && ctxChain !== wagmiChainId);
    if (!isLocalChange) {
      prevCtxChainRef.current = ctxChain;
      return;
    }

    setExchangeContext((prevCtx) => {
      const next = clone(prevCtx);
      const currentCtxChain = next.network?.chainId;

      next.network = resolveNetworkElement(ctxChain, next.network);

      if (currentCtxChain !== ctxChain) {
        next.tradeData.sellTokenContract = undefined;
        next.tradeData.buyTokenContract = undefined;
      }
      return next;
    }, 'watcher:contextChain');

    prevCtxChainRef.current = ctxChain;
    prevTokensRef.current = { sell: undefined, buy: undefined };
  }, [appChainId, contextState, isConnected, wagmiChainId, setExchangeContext]);

  /* ------------------- account watcher (balances/addr) ------------------ */
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
      const next = clone(prevCtx);

      if (nextSlice.address && isConnected) {
        const current = next.accounts.connectedAccount ?? ({} as WalletAccount);
        next.accounts.connectedAccount = {
          ...current,
          address: nextSlice.address as Address,
        };
      } else {
        next.accounts.connectedAccount = undefined as any;
      }

      if (next.tradeData.sellTokenContract) next.tradeData.sellTokenContract.balance = 0n;
      if (next.tradeData.buyTokenContract) next.tradeData.buyTokenContract.balance = 0n;

      return next;
    }, 'watcher:account');

    prevAccountRef.current = nextSlice;
  }, [address, accountStatus, isConnected, contextState, setExchangeContext]);

  /* ---------- tokens watcher (dedupe + auto-close selection UI) --------- */
  useEffect(() => {
    if (!contextState) return;

    const sellAddr = lower(contextState.tradeData.sellTokenContract?.address);
    const buyAddr = lower(contextState.tradeData.buyTokenContract?.address);

    const prev = prevTokensRef.current;
    const nextSlice = { sell: sellAddr, buy: buyAddr };
    if (shallowEqual(prev, nextSlice)) return;

    // A) Prevent duplicate token selection
    if (sellAddr && buyAddr && sellAddr === buyAddr) {
      setExchangeContext((prevCtx) => {
        const next = clone(prevCtx);
        next.tradeData.buyTokenContract = undefined;
        return next;
      }, 'watcher:tokens:dedupe');
    }

    // B) Auto-close selection overlay when a token is committed
    const root = contextState.settings?.spCoinPanelTree as SpCoinPanelTree | undefined;
    const selectOpen = root
      ? anyVisible(root, [
          SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST,
          SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST,
        ])
      : false;

    if ((sellAddr || buyAddr) && selectOpen && root) {
      setExchangeContext((prevCtx) => {
        const next = clone(prevCtx);
        next.settings.spCoinPanelTree = setOverlayVisible(
          next.settings.spCoinPanelTree as SpCoinPanelTree,
          SP_COIN_DISPLAY.TRADING_STATION_PANEL
        );
        return next;
      }, 'watcher:tokens:autoClose');
    }

    prevTokensRef.current = nextSlice;
  }, [
    contextState,
    contextState?.tradeData.sellTokenContract?.address,
    contextState?.tradeData.buyTokenContract?.address,
    contextState?.settings?.spCoinPanelTree,
    setExchangeContext,
  ]);
}
