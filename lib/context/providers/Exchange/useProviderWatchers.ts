// File: lib/context/providers/useProviderWatchers.ts

import { useEffect, useRef } from 'react';
import type { Address } from 'viem';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import type {
  ExchangeContext as ExchangeContextTypeOnly,
  WalletAccount,
} from '@/lib/structure';
import type { MainPanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';
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
  for (const k of ak) if ((a as any)[k] !== (b as any)[k]) return false;
  return true;
};

const isValidChainId = (n: unknown): n is number =>
  typeof n === 'number' && Number.isInteger(n) && n > 0;

function clone<T>(o: T): T {
  return typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));
}

/* ----------------------- Flat panel visibility helpers ---------------------- */

function anyVisible(panels: MainPanelNode, ids: SP_COIN_DISPLAY[]): boolean {
  return panels?.some?.((n) => ids.includes(n.panel as SP_COIN_DISPLAY) && !!n.visible) ?? false;
}

function setOverlayVisible(panels: MainPanelNode, targetId: SP_COIN_DISPLAY): MainPanelNode {
  const next = clone(panels ?? []);
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
  wagmiChainId?: number; // wallet chain id
  appChainId?: number;   // UI/app-preferred chain id
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

  /* ---------------- wagmi chain watcher (wallet-driven) ----------------
     Wallet is the single source of truth while connected.
  ---------------------------------------------------------------------- */
  useEffect(() => {
    if (!contextState) return;
    if (!isConnected) return;
    if (!isValidChainId(wagmiChainId)) return;

    const prevWagmi = prevWagmiChainRef.current;
    const nextWagmi = wagmiChainId!;

    // First run → record only, don't clear tokens
    if (isFirstWagmiRunRef.current) {
      isFirstWagmiRunRef.current = false;
      prevWagmiChainRef.current = nextWagmi;
      // Ensure context network matches wallet on first connect (no token clears)
      setExchangeContext((prevCtx) => {
        const currentCtxChain = prevCtx.network?.chainId;
        if (currentCtxChain === nextWagmi) return prevCtx;
        const next = structuredClone(prevCtx);
        next.network = resolveNetworkElement(nextWagmi, next.network);
        return next;
      }, 'watcher:wagmiChain:firstSync');
      return;
    }

    if (prevWagmi === nextWagmi) return;

    setExchangeContext((prevCtx) => {
      const currentCtxChain = prevCtx.network?.chainId;
      if (currentCtxChain === nextWagmi) return prevCtx;

      const next = structuredClone(prevCtx);
      next.network = resolveNetworkElement(nextWagmi, next.network);

      // Clear selected tokens only if the effective chain actually changed
      if (currentCtxChain !== nextWagmi) {
        if (next.tradeData?.sellTokenContract) next.tradeData.sellTokenContract = undefined as any;
        if (next.tradeData?.buyTokenContract) next.tradeData.buyTokenContract = undefined as any;
      }

      return next;
    }, 'watcher:wagmiChain');

    prevWagmiChainRef.current = nextWagmi;
    prevTokensRef.current = { sell: undefined, buy: undefined };
  }, [isConnected, wagmiChainId, setExchangeContext, contextState?.network?.chainId]);

  /* --------------- context/app chain watcher (UI/local) ----------------
     ONLY acts when wallet is disconnected. Ignores invalid (0/undefined).
  ---------------------------------------------------------------------- */
  useEffect(() => {
    if (!contextState) return;

    // If wallet is connected, do NOT let UI/app chain fight the wallet
    if (isConnected) {
      // Just update the ref to avoid treating later transitions as "changes"
      if (isValidChainId(appChainId)) prevCtxChainRef.current = appChainId!;
      return;
    }

    // Wallet disconnected → UI/app controls chain
    const ctxChain = isValidChainId(appChainId)
      ? appChainId!
      : (isValidChainId(contextState?.network?.chainId) ? contextState!.network!.chainId! : undefined);

    if (!isValidChainId(ctxChain)) return;

    if (isFirstCtxRunRef.current) {
      isFirstCtxRunRef.current = false;
      prevCtxChainRef.current = ctxChain;
      // Ensure context uses the appChain on first hydration while disconnected (no token clears)
      setExchangeContext((prevCtx) => {
        if (prevCtx.network?.chainId === ctxChain) return prevCtx;
        const next = structuredClone(prevCtx);
        next.network = resolveNetworkElement(ctxChain, next.network);
        return next;
      }, 'watcher:contextChain:firstSync');
      return;
    }

    const prevCtxChain = prevCtxChainRef.current ?? ctxChain;
    if (ctxChain === prevCtxChain) return;

    setExchangeContext((prevCtx) => {
      const currentCtxChain = prevCtx.network?.chainId;
      if (currentCtxChain === ctxChain) return prevCtx;

      const next = structuredClone(prevCtx);
      next.network = resolveNetworkElement(ctxChain, next.network);

      if (currentCtxChain !== ctxChain) {
        if (next.tradeData?.sellTokenContract) next.tradeData.sellTokenContract = undefined as any;
        if (next.tradeData?.buyTokenContract) next.tradeData.buyTokenContract = undefined as any;
      }

      return next;
    }, 'watcher:contextChain');

    prevCtxChainRef.current = ctxChain;
    prevTokensRef.current = { sell: undefined, buy: undefined };
  }, [isConnected, appChainId, setExchangeContext, contextState?.network?.chainId]);

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
      const next = structuredClone(prevCtx);

      if (nextSlice.address && isConnected) {
        const current = next.accounts?.connectedAccount ?? ({} as WalletAccount);
        next.accounts = next.accounts ?? ({} as any);
        next.accounts.connectedAccount = {
          ...current,
          address: nextSlice.address as Address,
        };
      } else {
        next.accounts = next.accounts ?? ({} as any);
        next.accounts.connectedAccount = undefined as any;
      }

      // Clear cached balances on selected tokens (guarded)
      if (next.tradeData?.sellTokenContract) next.tradeData.sellTokenContract.balance = 0n;
      if (next.tradeData?.buyTokenContract) next.tradeData.buyTokenContract.balance = 0n;

      return next;
    }, 'watcher:account');

    prevAccountRef.current = nextSlice;
  }, [address, accountStatus, isConnected, setExchangeContext, contextState?.tradeData]);

  /* ---------- tokens watcher (dedupe + auto-close selection UI) --------- */
  useEffect(() => {
    if (!contextState) return;

    const sellAddr = lower(contextState?.tradeData?.sellTokenContract?.address);
    const buyAddr  = lower(contextState?.tradeData?.buyTokenContract?.address);

    const prev = prevTokensRef.current;
    const nextSlice = { sell: sellAddr, buy: buyAddr };
    if (shallowEqual(prev, nextSlice)) return;

    // A) Duplicate prevention (same token on both sides)
    if (sellAddr && buyAddr && sellAddr === buyAddr) {
      setExchangeContext((prevCtx) => {
        const next = structuredClone(prevCtx);
        if (!next.tradeData) next.tradeData = {} as any;
        next.tradeData.buyTokenContract = undefined as any;
        return next;
      }, 'watcher:tokens:dedupe');
    }

    // B) Auto-close selection overlay → switch to TRADING when a token is committed
    const root = contextState?.settings?.mainPanelNode as MainPanelNode | undefined;
    const selectOpen = root
      ? anyVisible(root, [
          SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST,
          SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST,
        ])
      : false;

    if ((sellAddr || buyAddr) && selectOpen && root) {
      setExchangeContext((prevCtx) => {
        const next = structuredClone(prevCtx);
        if (next.settings?.mainPanelNode) {
          next.settings.mainPanelNode = setOverlayVisible(
            next.settings.mainPanelNode as MainPanelNode,
            SP_COIN_DISPLAY.TRADING_STATION_PANEL
          );
        }
        return next;
      }, 'watcher:tokens:autoClose');
    }

    prevTokensRef.current = nextSlice;
  }, [
    setExchangeContext,
    contextState?.tradeData?.sellTokenContract?.address,
    contextState?.tradeData?.buyTokenContract?.address,
    contextState?.settings?.mainPanelNode,
    contextState,
  ]);
}
