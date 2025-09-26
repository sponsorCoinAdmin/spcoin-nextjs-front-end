// File: lib/context/providers/useProviderWatchers.ts

import { useEffect, useRef } from 'react';
import type { Address } from 'viem';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import type {
  ExchangeContext as ExchangeContextTypeOnly,
  WalletAccount,
} from '@/lib/structure';
import type { MainPanelNode, PanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';
import { resolveNetworkElement } from '@/lib/context/helpers/NetworkHelpers';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

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

function clone<T>(o: T): T {
  return typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));
}

/* -------------------------- Panel tree helpers -------------------------- */

const MAIN_OVERLAY_GROUP: SP_COIN_DISPLAY[] = [
  SP_COIN_DISPLAY.TRADING_STATION_PANEL,
  SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST,
  SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST,
  SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL_LIST,
  SP_COIN_DISPLAY.AGENT_SELECT_PANEL_LIST,
  SP_COIN_DISPLAY.SPONSOR_SELECT_PANEL_LIST,
  SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL,
];

function visitTree(node: PanelNode, fn: (n: PanelNode) => void) {
  fn(node);
  if (Array.isArray(node.children)) {
    for (const c of node.children) visitTree(c, fn);
  }
}

function anyVisible(root: MainPanelNode, ids: SP_COIN_DISPLAY[]): boolean {
  let open = false;
  visitTree(root, (n) => {
    if (ids.includes(n.panel as SP_COIN_DISPLAY) && n.visible) open = true;
  });
  return open;
}

/** Set radio visibility across MAIN_OVERLAY_GROUP, turning on only `targetId`. */
function setOverlayVisible(root: MainPanelNode, targetId: SP_COIN_DISPLAY): MainPanelNode {
  const next = clone(root);
  visitTree(next, (n) => {
    if (MAIN_OVERLAY_GROUP.includes(n.panel as SP_COIN_DISPLAY)) {
      n.visible = (n.panel as SP_COIN_DISPLAY) === targetId;
    }
  });
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
  /** Wallet (wagmi) chain id — when connected */
  wagmiChainId?: number;
  /** App-first chain id (preferred source of truth) */
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
  // previous snapshots for change detection
  const prevWagmiChainRef = useRef<number | undefined>();
  const prevCtxChainRef = useRef<number | undefined>();
  const prevAccountRef = useRef<{ address?: string; status?: string; connected?: boolean }>();
  const prevTokensRef = useRef<{ sell?: string; buy?: string }>();

  // first-run guards so we don't clear tokens on initial hydration
  const isFirstWagmiRunRef = useRef(true);
  const isFirstCtxRunRef = useRef(true);

  // quick debug helper that always uses stringifyBigInt
  const dbg = (msg: string, data?: any) => {
    // keep this lightweight—your global logger prints a header already
    if (data !== undefined) {
      // eslint-disable-next-line no-console
      console.log(`[🛠️ watchers] LOG: ${msg}`, stringifyBigInt(data));
    } else {
      // eslint-disable-next-line no-console
      console.log(`[🛠️ watchers] LOG: ${msg}`);
    }
  };

  // MOUNT snapshots (helps verify whether tokens are present right after restore)
  useEffect(() => {
    if (!contextState) return;
    dbg('mount:snapshot');
    dbg('snapshot:context', {
      settings: contextState.settings,
      network: contextState.network,
      accounts: contextState.accounts,
      tradeData: contextState.tradeData,
    });
    dbg('snapshot:tradeData', contextState.tradeData);
    dbg('snapshot:settings', contextState.settings);
  }, [contextState]);

  /* ---------------- wagmi chain watcher (wallet-driven) ---------------- */

  useEffect(() => {
    dbg('effect:wagmiChain', { isConnected, wagmiChainId });

    if (!contextState) return;

    // Skip if wallet not connected or chainId not ready.
    if (!isConnected || wagmiChainId == null) {
      dbg('wagmiChain: not connected/missing chainId → skip');
      return;
    }

    const prevWagmi = prevWagmiChainRef.current;
    const nextWagmi = wagmiChainId;

    // First run: record only, do not clear tokens
    if (isFirstWagmiRunRef.current) {
      isFirstWagmiRunRef.current = false;
      prevWagmiChainRef.current = nextWagmi;
      dbg('wagmiChain:init-skip', { nextWagmi });
      return;
    }

    if (prevWagmi === nextWagmi) {
      dbg('wagmiChain: no change', { prevWagmi, nextWagmi });
      return;
    }

    dbg('wagmiChain:apply', { prevWagmi, nextWagmi });

    setExchangeContext((prevCtx) => {
      const next = structuredClone(prevCtx);

      const currentCtxChain = next.network?.chainId;
      next.network = resolveNetworkElement(nextWagmi, next.network);

      // Only clear tokens when the effective chain actually changes
      if (currentCtxChain !== nextWagmi) {
        next.tradeData.sellTokenContract = undefined;
        next.tradeData.buyTokenContract = undefined;
      }

      dbg('wagmiChain:post-apply', {
        network: next.network,
        tradeData: next.tradeData,
      });
      return next;
    }, 'watcher:wagmiChain');

    prevWagmiChainRef.current = nextWagmi;
    prevTokensRef.current = { sell: undefined, buy: undefined };
  }, [isConnected, wagmiChainId, contextState, setExchangeContext]);

  /* --------------- context/app chain watcher (UI/local) ---------------- */

  useEffect(() => {
    // prefer appChainId, fall back to contextState.network?.chainId (may be already hydrated from storage)
    const ctxChain =
      (typeof appChainId === 'number' ? appChainId : contextState?.network?.chainId);

    dbg('effect:ctxChain', { appChainId, ctxChainId: contextState?.network?.chainId });

    if (!contextState) return;
    if (ctxChain == null) return; // nothing to do yet

    // First run: record only, do not clear tokens
    if (isFirstCtxRunRef.current) {
      isFirstCtxRunRef.current = false;
      prevCtxChainRef.current = ctxChain;
      dbg('ctxChain:init-skip', { ctxChain });
      return;
    }

    const prevCtxChain = prevCtxChainRef.current ?? ctxChain;
    if (ctxChain === prevCtxChain) {
      dbg('ctxChain: no change');
      return;
    }

    // Treat as "local" change only when wallet is disconnected, or when it disagrees with wallet
    const isLocalChange = !isConnected || (wagmiChainId != null && ctxChain !== wagmiChainId);
    if (!isLocalChange) {
      // Wallet owns the chain; just record and bail
      prevCtxChainRef.current = ctxChain;
      dbg('ctxChain: remote (wallet) change → skip local apply', { ctxChain, wagmiChainId });
      return;
    }

    dbg('ctxChain:apply', { prevCtxChain, ctxChain });

    setExchangeContext((prevCtx) => {
      const next = structuredClone(prevCtx);

      const currentCtxChain = next.network?.chainId;
      next.network = resolveNetworkElement(ctxChain, next.network);

      // Only clear tokens when the effective chain actually changes
      if (currentCtxChain !== ctxChain) {
        next.tradeData.sellTokenContract = undefined;
        next.tradeData.buyTokenContract = undefined;
      }

      dbg('ctxChain:post-apply', {
        network: next.network,
        tradeData: next.tradeData,
      });
      return next;
    }, 'watcher:contextChain');

    prevCtxChainRef.current = ctxChain;
    prevTokensRef.current = { sell: undefined, buy: undefined };
  }, [appChainId, contextState, isConnected, wagmiChainId, setExchangeContext]);

  /* ------------------- account watcher (balances/addr) ------------------ */

  useEffect(() => {
    dbg('effect:account', { address, accountStatus, isConnected });

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
        // Wallet connected → hydrate connectedAccount with real address
        const current = next.accounts.connectedAccount ?? ({} as WalletAccount);
        next.accounts.connectedAccount = {
          ...current,
          address: nextSlice.address as Address,
        };
      } else {
        // Wallet disconnected → clear connectedAccount
        next.accounts.connectedAccount = undefined as any;
      }

      // When account changes, clear cached balances on selected tokens
      if (next.tradeData.sellTokenContract) next.tradeData.sellTokenContract.balance = 0n;
      if (next.tradeData.buyTokenContract) next.tradeData.buyTokenContract.balance = 0n;

      dbg('account:apply', {
        connectedAccount: next.accounts.connectedAccount
          ? { address: next.accounts.connectedAccount.address }
          : undefined,
        tradeData: next.tradeData,
      });

      return next;
    }, 'watcher:account');

    prevAccountRef.current = nextSlice;
  }, [address, accountStatus, isConnected, contextState, setExchangeContext]);

  /* ---------- tokens watcher (dedupe + auto-close selection UI) --------- */

  useEffect(() => {
    dbg('effect:tokens');

    if (!contextState) return;

    const sellAddr = lower(contextState.tradeData.sellTokenContract?.address);
    const buyAddr = lower(contextState.tradeData.buyTokenContract?.address);

    const prev = prevTokensRef.current;
    const nextSlice = { sell: sellAddr, buy: buyAddr };
    if (shallowEqual(prev, nextSlice)) {
      dbg('tokens:no-change', {});
      return;
    }

    // A) Duplicate prevention
    if (sellAddr && buyAddr && sellAddr === buyAddr) {
      setExchangeContext((prevCtx) => {
        const next = structuredClone(prevCtx);
        next.tradeData.buyTokenContract = undefined;
        return next;
      }, 'watcher:tokens:dedupe');
    }

    // B) Auto-close selection overlay → switch to TRADING when a token is committed
    const root = contextState.settings?.mainPanelNode as MainPanelNode | undefined;
    const selectOpen = root
      ? anyVisible(root, [
          SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST,
          SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST,
        ])
      : false;

    dbg('tokens:state', { sellAddr, buyAddr, selectOpen });

    if ((sellAddr || buyAddr) && selectOpen && root) {
      setExchangeContext((prevCtx) => {
        const next = structuredClone(prevCtx);
        next.settings.mainPanelNode = setOverlayVisible(
          next.settings.mainPanelNode as MainPanelNode,
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
    contextState?.settings?.mainPanelNode, // re-run when panel tree changes
    setExchangeContext,
  ]);
}
